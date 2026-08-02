import { cookies } from 'next/headers';
import Profile from '@/components/Profile';
import { userService } from '@/services/user.service';

export default async function StudentProfilePage() {
  const token = cookies().get("session")?.value;
  if (!token) {
    return <div className="p-8 text-center text-red-500">Bạn chưa đăng nhập.</div>;
  }

  try {
    const response = await userService.getProfile(token);
    const user = response.data;

    if (!user) {
      return <div className="p-8 text-center text-red-500">Không tìm thấy thông tin người dùng.</div>;
    }

    return <Profile user={user} type={user.role} />;
  } catch (error) {
    console.error("Profile page load error:", error);
    return <div className="p-8 text-center text-red-500">Không thể kết nối đến máy chủ.</div>;
  }
}