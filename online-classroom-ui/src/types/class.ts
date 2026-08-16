// ─── Class types ──────────────────────────────────────────────────────────────

export interface Grade {
  id: number;
  level: string;
}

export interface ClassSupervisor {
  id: string;
  user: {
    username: string;
    img: string | null;
  };
}

export interface ClassItem {
  id: number;
  class_code: string | null;
  name: string;
  capacity: number;
  gradeId: number;
  grade?: Grade;
  img: string | null;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  supervisorId: string | null;
  supervisor?: ClassSupervisor;
  _count: { students: number };
  joinRequests?: JoinRequest[];
}

export interface JoinRequest {
  id: number;
  classId: number;
  studentId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  student?: {
    id: number;
    user: { username: string; img: string | null; email: string | null };
  };
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreateClassRequest {
  name: string;
  capacity?: number;
  gradeId: number;
  img?: string;
}

export interface UpdateClassRequest {
  name?: string;
  capacity?: number;
  gradeId?: number;
  newGradeLevel?: string;
  img?: string;
  isProtected?: boolean;
  isLocked?: boolean;
  requiresApproval?: boolean;
  blockLeave?: boolean;
  allowGradesView?: boolean;
  supervisorId?: string;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface ClassListResponse {
  data: ClassItem[];
  count: number;
  currentClassCount: number;
  page: number;
}

export interface StudentMember {
  id: string;
  username: string;
  schoolname: string;
  img: string | null;
  class_name: string;
  classes: { name: string }[];
  email?: string | null;
}

export interface PendingMemberRequest {
  id: number;
  classCode: string;
  studentId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  student: {
    id: string;
    username: string;
    img: string | null;
  };
}

export interface ClassMembersResponse {
  data: StudentMember[];
  count: number;
  capacity?: number;
  pendingRequests: PendingMemberRequest[];
  page: number;
}

