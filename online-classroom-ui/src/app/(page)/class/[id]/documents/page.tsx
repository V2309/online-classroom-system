import { getCurrentUser } from "@/lib/auth-server";
import DocumentPageClient from "@/components/DocumentPageClient";
import { serverFetch } from "@/lib/server-api";
import { ClassDocumentsResponse } from "@/types/document";

interface DocumentPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}

export default async function Document({ params, searchParams }: DocumentPageProps) {
  const user = getCurrentUser();
  const classCode = params.id;

  if (!user) {
    return <div>Bạn cần đăng nhập để xem tài liệu.</div>;
  }

  const { page, search } = searchParams;
  const p = page ? parseInt(page) : 1;

  let queryParams = new URLSearchParams();
  queryParams.set("classCode", classCode);
  if (page) queryParams.set("page", page);
  if (search) queryParams.set("search", search);

  const queryString = queryParams.toString();
  const endpoint = `/documents${queryString ? `?${queryString}` : ""}`;

  let data: ClassDocumentsResponse = {
    files: [],
    count: 0,
    page: p,
    limit: 10,
  };

  try {
    data = await serverFetch<ClassDocumentsResponse>(endpoint);
  } catch (error) {
    console.error("Lỗi lấy danh sách tài liệu:", error);
  }

  return (
    <div className="px-4 py-4 bg-white rounded-lg shadow-md flex flex-col h-full">
      <DocumentPageClient
        userRole={user.role as string}
        initialFiles={data.files || []}
        classCode={classCode}
        count={data.count || 0}
        page={p}
      />
    </div>
  );
}