import Feed from "@/components/Feed";
import Share from "@/components/Share";
import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

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
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-400 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center gap-2 sm:gap-3 text-gray-800">
            <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
            <span className="truncate">Bảng tin lớp: {classInfo.name}</span>
          </h1>
        </div>
      </div>

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
