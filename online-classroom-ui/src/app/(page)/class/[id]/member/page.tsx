import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/setting";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { Student, Class } from "@prisma/client";
import MemberList from "@/components/MemberList";

type StudentList = Student & {
    classes: Class[];
};

// Định nghĩa kiểu cho các yêu cầu đang chờ (bao gồm thông tin student)
export type PendingRequest = Prisma.ClassJoinRequestGetPayload<{
  include: {
    student: {
      select: {
        id: true;
        username: true;
        img: true;
      }
    }
  }
}>;

const MemberListPage = async ({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentUser();
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // Query cho học sinh đã ở trong lớp
  const query: Prisma.StudentWhereInput = {
      classes: {
          some: {
              class_code: params.id as string,
          },
      },
  };

  // ... (logic filter 'queryParams' giữ nguyên) ...
  if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
          if (value !== undefined) {
              switch (key) {
                  case "search":
                      query.username = {
                          contains: value,
                          mode: "insensitive",
                      };
                      break;
              }
          }
      }
  }

  // Chạy song song các truy vấn để tăng tốc
  const [data, count, quantity, pendingRequests] = await prisma.$transaction([
    // 1. Lấy danh sách học sinh đã trong lớp (có phân trang)
    prisma.student.findMany({
        where: query,
        include: {
            classes: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (Number(p) - 1),
    }),
    // 2. Đếm tổng số học sinh đã trong lớp
    prisma.student.count({
        where: query,
    }),
    // 3. Lấy sĩ số tối đa của lớp
    prisma.class.findUnique({
        where: { class_code: params.id },
        select: { capacity: true },
    }),
    
    // 4. (MỚI) Lấy danh sách học sinh đang chờ phê duyệt
    prisma.classJoinRequest.findMany({
      where: {
        classCode: params.id,
        status: 'PENDING'
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            img: true // Lấy ảnh (nếu có)
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  ]);

  console.log("so luong hoc sinh: ", count);

  return (
    <MemberList
      data={data}
      count={count}
      capacity={quantity?.capacity}
      userRole={user?.role as string || "student"}
      page={p}
      classId={params.id}
      pendingRequests={pendingRequests} // <-- 5. Truyền prop mới xuống
    />
  );
};

export default MemberListPage;