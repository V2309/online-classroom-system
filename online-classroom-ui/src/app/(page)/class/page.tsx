
import { cookies } from "next/headers";
import ClassListPageCommon from "@/components/ClassListPageCommon";
import FormContainer from "@/components/FormContainer";
import Link from "next/link";
import { classService } from "@/services/class.service";

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // Lấy token đăng nhập từ cookie
  const token = cookies().get("session")?.value;
  
  if (!token) {
    return <div>Bạn chưa đăng nhập.</div>;
  }

  // Giải mã JWT để lấy role mà không cần gọi Database
  let role: "teacher" | "student" = "student";
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString("utf-8")
    );
    role = payload.role || "student";
  } catch (e) {
    console.error("Lỗi giải mã token tại ClassListPage:", e);
    return <div>Phiên đăng nhập không hợp lệ.</div>;
  }

  if (role !== "teacher" && role !== "student") {
    return <div>Bạn không có quyền truy cập.</div>;
  }

  const { page = "1", type = "", search = "" } = searchParams;

  let data: any[] = [];
  let count = 0;
  let currentClassCount = 0;

  try {
    const responseData = await classService.getClasses({ page, type, search }, token);
    const result = responseData.data || {};
    data = result.data || [];
    count = result.count || 0;
    currentClassCount = result.currentClassCount || 0;
  } catch (error) {
    console.error("Fetch classes error:", error);
    return <div>Không thể tải dữ liệu lớp học từ máy chủ.</div>;
  }

  const extraHeader = role === "teacher" ? (
    <>
      <Link
        href="/class/trashcan"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Lớp đã xóa
      </Link>

      <FormContainer table="class" type="create" />
    </>
  ) : role === "student" ? (
    <>
      <Link
        href="/class?type=pending"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Lớp đang chờ
      </Link>
    </>
  ) : null;

  return (
    <ClassListPageCommon
      data={data}
      count={count}
      page={parseInt(page, 10)}
      role={role}
      extraHeader={extraHeader}
      viewType={type === "pending" ? "pending" : "joined"}
      currentClassCount={currentClassCount}
    />
  );
};

export default ClassListPage;