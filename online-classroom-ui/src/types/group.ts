export interface GroupStudent {
  id: string;
  username: string;
  img: string | null;
  class_name: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  studentId: string;
  role: 'LEADER' | 'MEMBER';
  joinedAt: string | Date;
  student: GroupStudent;
}

export interface ClassGroupItem {
  id: string;
  name: string;
  color: string | null;
  maxSize: number | null;
  classCode: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdById: string;
  createdBy?: {
    id: string;
    username?: string;
  };
  members: GroupMember[];
}

export interface StudentWithoutGroup {
  id: string;
  username: string;
  img: string | null;
  class_name: string;
}

export interface ClassGroupsResponse {
  className: string;
  classCode: string;
  groups: ClassGroupItem[];
  studentsWithoutGroup: StudentWithoutGroup[];
}

export interface CreateGroupRequest {
  name: string;
  classCode: string;
  color?: string;
  maxSize?: number | null;
}

export interface UpdateGroupRequest {
  name?: string;
  color?: string;
  maxSize?: number | null;
}

export interface UpdateGroupMemberRequest {
  studentId: string;
  targetGroupId?: string | null;
  classCode: string;
}

export interface SetGroupLeaderRequest {
  studentId: string;
}
