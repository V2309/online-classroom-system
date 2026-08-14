import Link from "next/link";
import { serverFetch } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/auth-server";
import { ClassListResponse } from "@/types/class";
import ClassListPageCommon from "@/components/ClassListPageCommon";
import CreateClassModal from "@/components/modals/CreateClassModal";
import { Trash2, BookOpen, Clock, AlertCircle } from "lucide-react";

export default async function ClassListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  // Lấy User tức thì (0ms) từ cookie JWT, không tốn HTTP request
  const user = getCurrentUser();

  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-sm text-gray-600 mb-6">
            Vui lòng đăng nhập tài khoản giáo viên hoặc học sinh để xem trang này.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  const { page, type, search } = searchParams;
  const p = page ? parseInt(page, 10) : 1;

  const queryParams = new URLSearchParams();
  if (p) queryParams.set("page", p.toString());
  if (type) queryParams.set("type", type);
  if (search) queryParams.set("search", search);

  let classResponse: ClassListResponse = {
    data: [],
    count: 0,
    currentClassCount: 0,
    page: p,
  };

  try {
    classResponse = await serverFetch<ClassListResponse>(
      `/classes?${queryParams.toString()}`
    );
  } catch (err) {
    console.error("Lỗi lấy danh sách lớp học trên server:", err);
  }

  const { data = [], count = 0, currentClassCount = 0 } = classResponse;

  // Header tương ứng theo Role
  const extraHeader =
    user.role === "teacher" ? (
      <div className="flex items-center gap-3">
        <Link
          href="/class/trashcan"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Trash2 className="h-4 w-4 text-gray-500" />
          Lớp đã xóa
        </Link>
        <CreateClassModal />
      </div>
    ) : user.role === "student" ? (
      <div className="flex items-center gap-3">
        {type === "pending" ? (
          <Link
            href="/class"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-blue-600" />
            Lớp đã tham gia
          </Link>
        ) : (
          <Link
            href="/class?type=pending"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Clock className="h-4 w-4 text-orange-600" />
            Lớp đang chờ
          </Link>
        )}
      </div>
    ) : null;

  return (
    <ClassListPageCommon
      data={data}
      count={count}
      page={p}
      role={user.role as "teacher" | "student"}
      extraHeader={extraHeader}
      viewType={type === "pending" ? "pending" : "joined"}
      currentClassCount={currentClassCount}
      showClassCount={user.role === "teacher"}
    />
  );
}