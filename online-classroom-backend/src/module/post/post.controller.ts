import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateCommentDto, CreatePostDto, PostQueryDto } from './dto/post.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  // ─── GET /posts — Lấy danh sách bài viết ──────────────────────────────────
  @Get()
  getPosts(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PostQueryDto,
  ) {
    return this.postService.getPosts(user.id, query);
  }

  // ─── POST /posts — Tạo bài viết mới ───────────────────────────────────────
  @Post()
  createPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    return this.postService.createPost(user.id, dto);
  }

  // ─── DELETE /posts/:id — Xóa bài viết ─────────────────────────────────────
  @Delete(':id')
  deletePost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postService.deletePost(id, user.id, user.role);
  }

  // ─── GET /posts/:id/comments — Lấy bình luận của bài viết ─────────────────
  @Get(':id/comments')
  getComments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postService.getComments(id, user.id);
  }

  // ─── POST /posts/:id/comments — Thêm bình luận ───────────────────────────
  @Post(':id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postService.addComment(id, user.id, dto);
  }

  // ─── POST /posts/:id/like — Like / Unlike bài viết ────────────────────────
  @Post(':id/like')
  toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postService.toggleLike(id, user.id);
  }
}
