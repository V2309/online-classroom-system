import { getCurrentUser } from "@/lib/auth-server";
import { serverFetch } from "@/lib/server-api";
import ClassGroupsPageSimple from "@/components/ClassGroupsPageSimple";
import { ClassGroupItem, ClassGroupsResponse, StudentWithoutGroup as StudentWithoutGroupType } from "@/types/group";

export type ClassGroupWithMembers = ClassGroupItem;
export type StudentWithoutGroup = StudentWithoutGroupType;

const GroupsPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const user = getCurrentUser();

  if (!user) {
    return <div>Unauthorized</div>;
  }

  let data: ClassGroupsResponse = {
    className: '',
    classCode: params.id,
    groups: [],
    studentsWithoutGroup: [],
  };

  try {
    data = await serverFetch<ClassGroupsResponse>(`/groups/class/${params.id}`);
  } catch (error) {
    console.error('Lỗi tải thông tin nhóm:', error);
  }

  return (
    <ClassGroupsPageSimple
      classCode={params.id}
      className={data.className || ''}
      userRole={user.role as string}
      groups={data.groups || []}
      studentsWithoutGroup={data.studentsWithoutGroup || []}
      isTeacher={user.role === 'teacher'}
    />
  );
};

export default GroupsPage;