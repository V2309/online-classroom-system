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
  const user = getCurrentUser();

  if (!user || (user.role !== "teacher" && user.role !== "student")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 bg-background">
        <div className="bg-white border border-border rounded-3xl p-8 max-w-md text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-2">Không có quyền truy cập</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Vui lòng đăng nhập tài khoản giáo viên hoặc học sinh để xem trang này.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
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
      <div className="flex items-center gap-2.5 flex-wrap">
        <Link
          href="/class/trashcan"
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-foreground bg-white border border-border rounded-xl hover:bg-muted transition-colors shadow-2xs"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
          <span>Lớp đã xóa</span>
        </Link>
        <CreateClassModal />
      </div>
    ) : user.role === "student" ? (
      <div className="flex items-center gap-2.5 flex-wrap">
        {type === "pending" ? (
          <Link
            href="/class"
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-primary bg-accent rounded-xl hover:bg-accent/80 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Lớp đã tham gia</span>
          </Link>
        ) : (
          <Link
            href="/class?type=pending"
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors"
          >
            <Clock className="h-4 w-4 text-amber-700" />
            <span>Lớp đang chờ</span>
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