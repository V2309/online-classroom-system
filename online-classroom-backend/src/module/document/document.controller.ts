import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateDocumentDto, DocumentQueryDto } from './dto/document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // ─── GET /documents — Lấy danh sách tài liệu ─────────────────────────────
  @Get()
  getDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DocumentQueryDto,
  ) {
    return this.documentService.getDocuments(user.id, user.role, query);
  }

  // ─── GET /documents/:id — Lấy chi tiết tài liệu ──────────────────────────
  @Get(':id')
  getDocumentDetail(
    @Param('id') docId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentService.getDocumentDetail(docId, user.id, user.role);
  }

  // ─── GET /documents/:id/viewers — Lấy danh sách người xem tài liệu ───────
  @Get(':id/viewers')
  getDocumentViewers(
    @Param('id') docId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentService.getDocumentViewers(docId, user.id, user.role);
  }

  // ─── POST /documents — Tạo tài liệu mới (Teacher) ────────────────────────
  @Post()
  @Roles('teacher')
  createDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentService.createDocument(user.id, dto);
  }

  // ─── DELETE /documents/:id — Xóa tài liệu (Teacher) ──────────────────────
  @Delete(':id')
  @Roles('teacher')
  deleteDocument(
    @Param('id') docId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentService.deleteDocument(docId, user.id);
  }
}
