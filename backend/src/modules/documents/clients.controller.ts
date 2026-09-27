// Clients controller — the admin clients tab and per-client documents
//
// Every route here is ADMIN-only: the tab, the per-client table and the
// removal belong to the judicial administration team alone. Deletion is
// permanent and confirmed client-side; the API answers 204 with nothing to
// undo.

import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { AuthenticatedGuard, type AuthenticatedUser } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  DocumentsService,
  type ClientDocuments,
  type ClientList,
} from './documents.service';

@Controller('clients')
@UseGuards(AuthenticatedGuard, AdminGuard)
export class ClientsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(
    @Query('search') search: string | undefined,
    @Query('company') company: string | undefined,
    @Query('page') page: string | undefined,
  ): Promise<ClientList> {
    return this.documents.listClients(search, company, page);
  }

  @Get(':userId/documents')
  clientDocuments(
    @Param('userId') userId: string,
    @Query('page') page: string | undefined,
  ): Promise<ClientDocuments> {
    return this.documents.clientDocuments(userId, page);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeClient(
    @Param('userId') userId: string,
    @CurrentUser() caller: AuthenticatedUser,
  ): Promise<void> {
    await this.documents.removeClient(userId, caller.id);
  }
}
