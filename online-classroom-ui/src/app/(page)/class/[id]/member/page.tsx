import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";
import MemberList from "@/components/MemberList";
import { ClassMembersResponse, PendingMemberRequest, StudentMember } from "@/types/class";

export type PendingRequest = PendingMemberRequest;

const MemberListPage = async ({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = getCurrentUser();
  const { page, search } = searchParams;
  const p = page ? parseInt(page) : 1;

  const queryParams = new URLSearchParams();
  if (page) queryParams.set("page", page);
  if (search) queryParams.set("search", search);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  let result: ClassMembersResponse = {
    data: [],
    count: 0,
    capacity: undefined,
    pendingRequests: [],
    page: p,
  };

  try {
    result = await serverFetch<ClassMembersResponse>(
      `/classes/${params.id}/members${queryString}`
    );
  } catch (error) {
    console.error("Lỗi tải danh sách thành viên:", error);
  }

  return (
    <MemberList
      data={result.data || []}
      count={result.count || 0}
      capacity={result.capacity}
      userRole={(user?.role as string) || "student"}
      page={p}
      classId={params.id}
      pendingRequests={result.pendingRequests || []}
    />
  );
};

export default MemberListPage;