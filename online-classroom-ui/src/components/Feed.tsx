import prisma from "@/lib/prisma";
import Post from "@/components/Post";
import { getCurrentUser } from "@/lib/auth";
import InfiniteFeed from "./InfiniteFeed";

const Feed = async ({ userProfileId, classCode }: { userProfileId?: string, classCode?: string }) => {
  const userSession = await getCurrentUser();

  if (!userSession) return null;

  // Lấy thông tin user đầy đủ từ database (để có avatar)
  const user = await prisma.user.findUnique({
    where: { id: userSession.id as string },
    select: { 
      id: true, 
      username: true, 
      img: true,
      role: true 
    }
  });

  if (!user) return null;

  const whereCondition = classCode
    ? { parentPostId: null, classCode: classCode }
    : userProfileId
    ? { parentPostId: null, userId: userProfileId }
    : { parentPostId: null };

  const postIncludeQuery = {
    user: { select: { username: true, img: true } },
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId: user.id as string }, select: { id: true } },
  };

  // Lấy page đầu tiên (3 posts đầu tiên)
  const initialPosts = await prisma.post.findMany({
    where: whereCondition,
    include: postIncludeQuery,
    take: 3,
    skip: 0,
    orderBy: { createdAt: "desc" },
  });

  // Nếu không có posts nào cả
  if (initialPosts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chưa có bài viết nào trong lớp này</p>
      </div>
    );
  }

  return (
    <div className="">
      {/* Hiển thị posts đầu tiên */}
      {initialPosts.map((post) => (
        <div key={post.id}>
          <Post post={post} />
        </div>
      ))}
      
      {/* Infinite scroll cho các posts tiếp theo */}
      <InfiniteFeed userProfileId={userProfileId} classCode={classCode} />
    </div>
  );
};

export default Feed;