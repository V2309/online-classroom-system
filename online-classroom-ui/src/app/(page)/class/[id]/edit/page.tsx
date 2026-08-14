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
      <div className="p-8 text-center text-red-500 font-medium">
        Không tìm thấy lớp học.
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <EditClassForm
          classEdit={classEdit}
          grades={grades}
          classCode={params.id}
        />
      </div>
    </div>
  );
}