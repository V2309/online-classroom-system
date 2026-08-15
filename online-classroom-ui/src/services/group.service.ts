import { api } from '@/lib/api';
import {
  ClassGroupItem,
  ClassGroupsResponse,
  CreateGroupRequest,
  SetGroupLeaderRequest,
  UpdateGroupMemberRequest,
  UpdateGroupRequest,
} from '@/types/group';

export const groupService = {
  // ─── Lấy danh sách nhóm và học sinh của lớp ──────────────────────────────
  async getClassGroups(classCode: string): Promise<ClassGroupsResponse> {
    const response = await api.get<ClassGroupsResponse>(`/groups/class/${classCode}`);
    return response.data;
  },

  // ─── Tạo nhóm mới ────────────────────────────────────────────────────────
  async createGroup(data: CreateGroupRequest): Promise<ClassGroupItem> {
    const response = await api.post<ClassGroupItem>('/groups', data);
    return response.data;
  },

  // ─── Cập nhật nhóm ───────────────────────────────────────────────────────
  async updateGroup(
    groupId: string,
    data: UpdateGroupRequest
  ): Promise<ClassGroupItem> {
    const response = await api.patch<ClassGroupItem>(`/groups/${groupId}`, data);
    return response.data;
  },

  // ─── Xóa nhóm ────────────────────────────────────────────────────────────
  async deleteGroup(groupId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/groups/${groupId}`);
    return response.data;
  },

  // ─── Kéo thả cập nhật thành viên ─────────────────────────────────────────
  async updateGroupMembers(
    data: UpdateGroupMemberRequest
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/groups/members', data);
    return response.data;
  },

  // ─── Thiết lập trưởng nhóm ───────────────────────────────────────────────
  async setGroupLeader(
    groupId: string,
    data: SetGroupLeaderRequest
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `/groups/${groupId}/leader`,
      data
    );
    return response.data;
  },
};
