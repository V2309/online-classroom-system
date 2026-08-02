import { getDeletedClasses } from "@/lib/actions/class.action";
import ClassListPageCommon from "@/components/ClassListPageCommon";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const DeletedClassesPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const page = parseInt(searchParams?.page || "1");
  const search = searchParams?.search || "";

  const deletedClasses = await getDeletedClasses();
  
  // Filter theo search nếu có
  const filteredClasses = deletedClasses.filter((classItem: any) =>
    classItem.name.toLowerCase().includes(search.toLowerCase()) ||
    classItem.class_code?.toLowerCase().includes(search.toLowerCase())
  );

  const itemsPerPage = 12;
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách lớp
          </Link>
        }
      />
    </div>
  );
};

export default DeletedClassesPage;