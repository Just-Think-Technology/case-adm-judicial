// Companies controller — §4.7 panel listing and §4.8 case management
//
// Listing and detail are public (the transparency layer is part of the
// product); mutations are ADMIN-only. CSRF needs no per-route guard here: the
// global Origin check plus SameSite cookies already cover authenticated
// mutations, the same treatment as the authenticated auth routes.

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { AuthenticatedGuard } from '../auth/session.guard';
import { CompaniesService, type CompanyCard, type CompanyDetails } from './companies.service';
import { CompanyDto } from './dto/company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list(@Query('nature') nature?: string, @Query('search') search?: string): Promise<CompanyCard[]> {
    return this.companies.list(nature, search);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<CompanyDetails> {
    return this.companies.get(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthenticatedGuard, AdminGuard)
  create(@Body() input: CompanyDto): Promise<CompanyDetails> {
    return this.companies.create(input);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthenticatedGuard, AdminGuard)
  replace(@Param('id') id: string, @Body() input: CompanyDto): Promise<CompanyDetails> {
    return this.companies.replace(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthenticatedGuard, AdminGuard)
  async remove(@Param('id') id: string): Promise<void> {
    await this.companies.remove(id);
  }
}
