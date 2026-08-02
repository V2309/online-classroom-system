import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import ClassGroupsPageSimple from "@/components/ClassGroupsPageSimple";

// Types cho group
export type ClassGroupWithMembers = Prisma.ClassGroupGetPayload<{
  include: {
    members: {
      include: {
        student: {
          select: {
            id: true;
            username: true;
            img: true;
            class_name: true;
          }
        }
      }
    }
  }
}>;

// Types cho students chưa có nhóm
export type StudentWithoutGroup = {
  id: string;
  username: string;
  img: string | null;
  class_name: string;
};

const GroupsPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const user = await getCurrentUser();

  if (!user) {
    return <div>Unauthorized</div>;
  }

  // Kiểm tra quyền truy cập lớp học
  const classInfo = await prisma.class.findFirst({
    where: {
      class_code: params.id,
      deleted: false,
    },
    include: {
      supervisor: true,
    },
  });

  if (!classInfo) {
    return <div>Không tìm thấy lớp học</div>;
  }

  // Lấy danh sách tất cả học sinh trong lớp
  const allStudents = await prisma.student.findMany({
    where: {
      classes: {
        some: {
          class_code: params.id,
        },
      },
    },
    select: {
      id: true,
      username: true,
      img: true,
      class_name: true,
    },
  });

  // Lấy danh sách các nhóm đã tạo
  const groups = await prisma.classGroup.findMany({
    where: {
      classCode: params.id,
    },
    include: {
      members: {
        include: {
          student: {
            select: {
              id: true,
              username: true,
              img: true,
              class_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Tìm học sinh chưa có nhóm
  const studentsInGroups = groups.flatMap(group => 
    group.members.map(member => member.student.id)
  );
  
  const studentsWithoutGroup = allStudents.filter(
    student => !studentsInGroups.includes(student.id)
  );

  return (
    <ClassGroupsPageSimple
      classCode={params.id}
      className={classInfo.name}
      userRole={user.role}
      groups={groups}
      studentsWithoutGroup={studentsWithoutGroup}
      isTeacher={user.role === 'teacher'}
    />
  );
};

export default GroupsPage;