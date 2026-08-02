import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/setting";
import { Prisma, UserRole } from "@prisma/client"; // Import UserRole
import UserList from "@/components/UserList"; // Import component client mới

// Định nghĩa kiểu dữ liệu cho User trả về
export type UserForList = Prisma.UserGetPayload<{
  select: {
    id: true;
    username: true;
    email: true;
    img: true;
    role: true;
    schoolname: true;
    class_name: true;
    createdAt: true;
    isBanned: true;
  }
}>;

const UserDashboardPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // Lấy thông tin session (ví dụ: kiểm tra xem có phải admin không)
  // const user = await getCurrentUser(); 
  // if (user?.role !== 'admin') { // Ví dụ: Chỉ admin mới xem được
  //   redirect("/unauthorized");
  // }

  const { page, search, role, ...otherParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Query cho TẤT CẢ user
  const query: Prisma.UserWhereInput = {};

  // Xử lý filter (tương tự trang member)
  if (search) {
    query.username = {
      contains: search,
      mode: "insensitive",
    };
  }
  
  // (MỚI) Thêm filter theo vai trò
  if (role && ['teacher', 'student'].includes(role)) {
     query.role = {
        equals: role as UserRole,
     };
  }

  // Chạy song song các truy vấn
  const [data, count] = await prisma.$transaction([
    // 1. Lấy danh sách người dùng (có phân trang)
    prisma.user.findMany({
      where: query,
      select: { // Chỉ chọn các trường cần thiết
        id: true,
        username: true,
        email: true,
        img: true,
        role: true,
        schoolname: true,
        class_name: true,
        createdAt: true,
        isBanned: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (Number(p) - 1),
      orderBy: {
        createdAt: 'desc' // Sắp xếp người dùng mới nhất lên đầu
      }
    }),
    
    // 2. Đếm tổng số người dùng
    prisma.user.count({
      where: query,
    }),
  ]);


  return (
    <UserList
      data={data}
      count={count}
      page={p}
    />
  );
};

export default UserDashboardPage;