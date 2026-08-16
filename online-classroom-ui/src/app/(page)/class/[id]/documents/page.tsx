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
    return (
      <div className="h-full flex items-center justify-center p-6 text-foreground bg-background">
        <div className="bg-white border border-border rounded-3xl p-8 max-w-md text-center shadow-sm">
          <p className="text-base font-bold text-destructive mb-2">Chưa đăng nhập</p>
          <p className="text-xs text-muted-foreground">Bạn cần đăng nhập để xem tài liệu của lớp.</p>
        </div>
      </div>
    );
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
    <div className="h-full w-full p-4 sm:p-5 flex flex-col overflow-hidden bg-background text-foreground">
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