import Feed from "@/components/Feed";
import Share from "@/components/Share";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";
import ClassPageHeader from "@/components/ClassPageHeader";

export default async function NewsfeedPage({ params }: { params: { id: string } }) {
  // Lấy thông tin lớp học từ NestJS API
  let classInfo: any = null;
  try {
    classInfo = await serverFetch(`/classes/${params.id}`);
  } catch (error) {
    console.error("Lỗi lấy thông tin lớp học:", error);
  }

  if (!classInfo) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Không tìm thấy lớp học
      </div>
    );
  }

  // Lấy thông tin user hiện tại
  const user = getCurrentUser();
  const classCode = classInfo.class_code || params.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClassPageHeader title={`Bảng tin lớp: ${classInfo.name}`} className="sticky top-0 z-40" />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Form tạo bài viết mới */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
          <Share classCode={classCode} userImg={user?.img || undefined} />
        </div>

        {/* Feed */}
        <div className="space-y-4 sm:space-y-6">
          <Feed classCode={classCode} />
        </div>
      </div>
    </div>
  );
}
