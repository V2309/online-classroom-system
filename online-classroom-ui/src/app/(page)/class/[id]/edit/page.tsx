import { serverFetch } from "@/lib/server-api";
import EditClassForm from "@/components/forms/EditClassForm";

export default async function EditClassPage({ params }: { params: { id: string } }) {
  let classEdit: any = null;
  let grades: any[] = [];

  try {
    const [classData, gradeList] = await Promise.all([
      serverFetch(`/classes/${params.id}`),
      serverFetch("/classes/grades"),
    ]);
    classEdit = classData;
    grades = Array.isArray(gradeList) ? gradeList : [];
  } catch (error) {
    console.error("Lỗi lấy thông tin lớp học cần sửa:", error);
  }

  if (!classEdit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground">
        <div className="bg-white border border-border rounded-3xl p-8 max-w-md text-center shadow-sm">
          <p className="text-base font-bold text-destructive mb-2">Không tìm thấy lớp học</p>
          <p className="text-xs text-muted-foreground">Lớp học không tồn tại hoặc bạn không có quyền truy cập.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <EditClassForm
          classEdit={classEdit}
          grades={grades}
          classCode={params.id}
        />
      </div>
    </div>
  );
}