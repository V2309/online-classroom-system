import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { CreateCommentDto, CreatePostDto, PostQueryDto } from './dto/post.dto';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── GET /posts — Lấy danh sách bài viết ──────────────────────────────────
  async getPosts(currentUserId: string, query: PostQueryDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, parseInt(query.limit || '5', 10));
    const skip = (page - 1) * limit;

    const where: any = { parentPostId: null };
    if (query.classCode) {
      where.classCode = query.classCode;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, img: true, role: true },
          },
          _count: { select: { likes: true, comments: true } },
          likes: {
            where: { userId: currentUserId },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    const formattedPosts = posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedPosts,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  // ─── POST /posts — Tạo bài viết mới ───────────────────────────────────────
  async createPost(userId: string, dto: CreatePostDto) {
    const newPost = await this.prisma.post.create({
      data: {
        desc: dto.desc,
        img: dto.img,
        imgHeight: dto.imgHeight,
        video: dto.video,
        classCode: dto.classCode,
        parentPostId: dto.parentPostId,
        userId,
      },
      include: {
        user: {
          select: { id: true, username: true, img: true, role: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return {
      ...newPost,
      isLiked: false,
      likesCount: 0,
      commentsCount: 0,
    };
  }

  // ─── DELETE /posts/:id — Xóa bài viết ─────────────────────────────────────
  async deletePost(postId: number, userId: string, userRole: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        class: { select: { supervisor: { select: { userId: true } } } },
      },
    });

    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại.');
    }

    const isAuthor = post.userId === userId;
    const isTeacherSupervisor = post.class?.supervisor?.userId === userId;
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isTeacherSupervisor && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xóa bài viết này.');
    }

    // Xóa tất cả likes và comments liên quan
    await this.prisma.$transaction([
      this.prisma.like.deleteMany({
        where: {
          OR: [{ postId }, { post: { parentPostId: postId } }],
        },
      }),
      this.prisma.post.deleteMany({ where: { parentPostId: postId } }),
      this.prisma.post.delete({ where: { id: postId } }),
    ]);

    return { message: 'Đã xóa bài viết thành công.' };
  }

  // ─── GET /posts/:id/comments — Lấy danh sách bình luận ────────────────────
  async getComments(postId: number, currentUserId: string) {
    const comments = await this.prisma.post.findMany({
      where: { parentPostId: postId },
      include: {
        user: {
          select: { id: true, username: true, img: true, role: true },
        },
        _count: { select: { likes: true, comments: true } },
        likes: {
          where: { userId: currentUserId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments.map((c) => ({
      ...c,
      isLiked: c.likes.length > 0,
      likesCount: c._count.likes,
      commentsCount: c._count.comments,
    }));
  }

  // ─── POST /posts/:id/comments — Thêm bình luận ───────────────────────────
  async addComment(postId: number, userId: string, dto: CreateCommentDto) {
    const parentPost = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!parentPost) {
      throw new NotFoundException('Bài viết không tồn tại.');
    }

    const comment = await this.prisma.post.create({
      data: {
        desc: dto.desc,
        userId,
        parentPostId: postId,
        classCode: parentPost.classCode,
      },
      include: {
        user: {
          select: { id: true, username: true, img: true, role: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return {
      ...comment,
      isLiked: false,
      likesCount: 0,
      commentsCount: 0,
    };
  }

  // ─── POST /posts/:id/like — Like / Unlike bài viết ────────────────────────
  async toggleLike(postId: number, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại.');
    }

    const existingLike = await this.prisma.like.findFirst({
      where: { postId, userId },
    });

    if (existingLike) {
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      const likesCount = await this.prisma.like.count({ where: { postId } });
      return { isLiked: false, likesCount };
    } else {
      await this.prisma.like.create({
        data: { postId, userId },
      });
      const likesCount = await this.prisma.like.count({ where: { postId } });
      return { isLiked: true, likesCount };
    }
  }
}
