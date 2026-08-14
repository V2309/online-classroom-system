import Link from "next/link";
import { serverFetch } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/auth-server";
import { ClassItem } from "@/types/class";
import ClassListPageCommon from "@/components/ClassListPageCommon";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default async function DeletedClassesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const user = getCurrentUser();

  if (!user || user.role !== "teacher") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-sm text-gray-600 mb-6">
            Chỉ giáo viên mới có quyền xem danh sách lớp đã xóa.
          </p>
          <Link
            href="/class"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Quay lại danh sách lớp
          </Link>
        </div>
      </div>
    );
  }

  const page = parseInt(searchParams?.page || "1", 10);
  const search = (searchParams?.search || "").toLowerCase();

  let deletedClasses: ClassItem[] = [];
  try {
    deletedClasses = await serverFetch<ClassItem[]>("/classes/deleted");
  } catch (err) {
    console.error("Lỗi khi tải danh sách lớp đã xóa trên server:", err);
    deletedClasses = [];
  }

  // Filter theo search nếu có
  const filteredClasses = (deletedClasses || []).filter(
    (classItem: ClassItem) =>
      classItem.name.toLowerCase().includes(search) ||
      classItem.class_code?.toLowerCase().includes(search)
  );

  const itemsPerPage = 8;
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <ClassListPageCommon
        data={paginatedClasses}
        count={filteredClasses.length}
        page={page}
        role="teacher"
        showClassCount={false}
        extraHeader={
          <Link
            href="/class"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách lớp
          </Link>
        }
      />
    </div>
  );
}