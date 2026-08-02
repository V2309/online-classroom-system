// app/(page)/class/[id]/documents/page.tsx
import { getCurrentUser } from "@/lib/auth";
import DocumentPageClient from "@/components/DocumentPageClient";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/setting";
interface DocumentPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}

export default async function Document({ params, searchParams }: DocumentPageProps) {
  // Lấy thông tin user từ server
  const user = await getCurrentUser();
  const classCode = params.id;

  if (!user) {
    return <div>Bạn cần đăng nhập để xem tài liệu.</div>;
  }

  // Lấy danh sách tài liệu từ server
  const { page, search } = searchParams;
  const p = page ? parseInt(page) : 1;
  
  let whereClause: any = { classCode };
  
  // Nếu là teacher, chỉ lấy files do họ upload
  if (user.role === "teacher") {
    whereClause.uploadedBy = user.id;
  }

  // Thêm điều kiện search nếu có
  if (search) {
    whereClause.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  // Sử dụng transaction để lấy cả files và count
  const [files, count] = await prisma.$transaction([
    // Lấy danh sách files
    prisma.file.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            username: true,
          },
        },
        class: {
          select: {
            name: true,
            class_code: true,
          },
        },
        views: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            viewedAt: 'asc' // Sắp xếp theo thời gian xem để lấy lần đầu tiên
          }
        },
        _count: {
          select: {
            views: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    
    // Đếm tổng số files
    prisma.file.count({ where: whereClause }),
  ]);

  // Thêm thông tin về việc user hiện tại đã xem file hay chưa và convert Date thành string
  const filesWithViewStatus = files.map(file => {
    const userView = file.views.find(view => view.user.id === user.id);
    return {
      ...file,
      uploadedAt: file.uploadedAt.toISOString(),
      views: file.views.map(view => ({
        ...view,
        viewedAt: view.viewedAt.toISOString()
      })),
      viewedByCurrentUser: !!userView,
      firstViewedAt: userView?.viewedAt?.toISOString() || null
    };
  });

  return (
    <div className="px-4 py-4 bg-white rounded-lg shadow-md flex flex-col h-full">
      {/* Truyền data và role xuống client component */}
      <DocumentPageClient 
        userRole={user?.role as string} 
        initialFiles={filesWithViewStatus}
        classCode={classCode}
        count={count}
        page={p}
      />
    </div>
  );
}