import Post from "@/components/Post";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";
import InfiniteFeed from "./InfiniteFeed";

const Feed = async ({
  userProfileId,
  classCode,
}: {
  userProfileId?: string;
  classCode?: string;
}) => {
  const user = getCurrentUser();
  if (!user) return null;

  let initialPosts: any[] = [];
  try {
    const params = new URLSearchParams({ page: "1", limit: "3" });
    if (classCode) params.append("classCode", classCode);
    if (userProfileId) params.append("userId", userProfileId);

    const res = await serverFetch<any>(`/posts?${params.toString()}`);
    initialPosts = Array.isArray(res) ? res : res?.data || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách bài viết ban đầu:", error);
    initialPosts = [];
  }

  // Nếu không có posts nào cả
  if (initialPosts.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg border border-gray-100 shadow-sm">
        <p className="text-gray-500">Chưa có bài viết nào trong lớp này</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hiển thị posts đầu tiên */}
      {initialPosts.map((post) => (
        <div key={post.id} className="mb-4">
          <Post post={post} />
        </div>
      ))}

      {/* Infinite scroll cho các posts tiếp theo */}
      <InfiniteFeed userProfileId={userProfileId} classCode={classCode} />
    </div>
  );
};

export default Feed;