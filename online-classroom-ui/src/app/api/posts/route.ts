import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const userProfileId = searchParams.get("user");
  const classCode = searchParams.get("classCode");
  const page = searchParams.get("cursor");
  const LIMIT = 3;

  const userSession = await getCurrentUser();

  if (!userSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const whereCondition = classCode
    ? { parentPostId: null, classCode: classCode }
    : userProfileId !== "undefined"
    ? { parentPostId: null, userId: userProfileId as string }
    : { parentPostId: null };

  const postIncludeQuery = {
    user: { select: { username: true, img: true } },
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId: userSession.id as string }, select: { id: true } },
  };

  const posts = await prisma.post.findMany({
    where: whereCondition,
    include: postIncludeQuery,
    take: LIMIT,
    skip: Math.max(0, (Number(page || 1) - 1) * LIMIT),
    orderBy: { createdAt: "desc" }
  });

  const totalPosts = await prisma.post.count({ where: whereCondition });
  const currentPage = Number(page || 1);
  const hasMore = currentPage * LIMIT < totalPosts;

  // await new Promise((resolve) => setTimeout(resolve, 3000));

  return Response.json({ posts, hasMore });
}