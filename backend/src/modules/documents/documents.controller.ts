// Documents controller — §4.9 upload, §4.8d company listing, §4.10 delivery
//
// Upload and listing hang off the company: the company id travels in the URL,
// so an unknown company is a 404 before any file is read. Delivery addresses
// the document directly and answers 404 to strangers, never 403 — the row's
// existence must not leak through the status code.

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { getThrottleTracker } from '../../common/throttling/throttler.config';
import {
  DOWNLOAD_LIMIT_PER_MINUTE,
  ONE_MINUTE_IN_MS,
  UPLOAD_LIMIT_PER_MINUTE,
} from '../../common/throttling/throttling.constants';
import { AuthenticatedGuard, type AuthenticatedUser } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  DocumentsService,
  type DocumentItem,
  type DocumentSummary,
} from './documents.service';

@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('companies/:companyId/documents')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthenticatedGuard)
  @Throttle({
    default: {
      limit: UPLOAD_LIMIT_PER_MINUTE,
      ttl: ONE_MINUTE_IN_MS,
      getTracker: getThrottleTracker,
    },
  })
  upload(
    @Param('companyId') companyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<DocumentSummary> {
    return this.documents.upload(companyId, user.id, req);
  }

  @Get('companies/:companyId/documents')
  list(
    @Param('companyId') companyId: string,
    @Query('scope') scope: string | undefined,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<DocumentItem[]> {
    return this.documents.list(companyId, viewer, scope);
  }

  @Get('documents/:id/content')
  @Throttle({
    default: {
      limit: DOWNLOAD_LIMIT_PER_MINUTE,
      ttl: ONE_MINUTE_IN_MS,
      getTracker: getThrottleTracker,
    },
  })
  async content(
    @Param('id') id: string,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.documents.getContent(id, viewer);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `${file.inline ? 'inline' : 'attachment'}; filename="${file.fileName}"`,
    });
    return new StreamableFile(file.stream);
  }
}
