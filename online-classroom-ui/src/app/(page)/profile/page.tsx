import Profile from '@/components/Profile';
import { serverFetch } from '@/lib/server-api';
import { getCurrentUser } from '@/lib/auth-server';

export default async function StudentProfilePage() {
  const userSession = getCurrentUser();
  if (!userSession) {
    return <div className="p-8 text-center text-destructive bg-background">Bạn chưa đăng nhập.</div>;
  }

  try {
    const user = await serverFetch<any>('/users/me');

    if (!user) {
      return <div className="p-8 text-center text-destructive bg-background">Không tìm thấy thông tin người dùng.</div>;
    }

    return (
      <div className="bg-background text-foreground min-h-screen">
        <Profile user={user} type={user.role} />
      </div>
    );
  } catch (error) {
    console.error("Profile page load error:", error);
    return <div className="p-8 text-center text-destructive bg-background">Không thể kết nối đến máy chủ.</div>;
  }
}