"use client";

import { useState } from "react";
import Image from "@/components/Image";
import { toast } from "react-toastify";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ClassGroupItem, StudentWithoutGroup } from "@/types/group";
import { groupService } from "@/services/group.service";
import { Users, Plus, Trash2, X, Sparkles, GripVertical, UserPlus, Check } from "lucide-react";

interface ClassGroupsPageProps {
  classCode: string;
  className: string;
  userRole: string;
  groups: ClassGroupItem[];
  studentsWithoutGroup: StudentWithoutGroup[];
  isTeacher: boolean;
}

const groupColors = {
  blue: "#2b5938",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#e11d48",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  orange: "#ea580c",
  teal: "#0d9488",
};

const ClassGroupsPageSimple: React.FC<ClassGroupsPageProps> = ({
  classCode,
  className,
  userRole,
  groups: initialGroups,
  studentsWithoutGroup: initialStudents,
  isTeacher,
}) => {
  const [groups, setGroups] = useState(initialGroups);
  const [studentsWithoutGroup, setStudentsWithoutGroup] = useState(initialStudents);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [maxGroupSize, setMaxGroupSize] = useState<number | null>(null);

  // Xử lý logic cập nhật UI sau khi kéo thả
  const updateUIAfterDrop = (
    studentId: string,
    sourceGroupId: string | null,
    targetGroupId: string | null
  ) => {
    let studentToMove: StudentWithoutGroup | null = null;

    if (sourceGroupId) {
      const sourceGroup = groups.find((g) => g.id === sourceGroupId);
      const member = sourceGroup?.members.find((m) => m.student.id === studentId);
      if (member) {
        studentToMove = member.student;
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id === sourceGroupId) {
              return {
                ...g,
                members: g.members.filter((m) => m.student.id !== studentId),
              };
            }
            return g;
          })
        );
      }
    } else {
      studentToMove = studentsWithoutGroup.find((s) => s.id === studentId) || null;
      if (studentToMove) {
        setStudentsWithoutGroup((prev) => prev.filter((s) => s.id !== studentId));
      }
    }

    if (!studentToMove) return;

    if (targetGroupId) {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === targetGroupId) {
            return {
              ...g,
              members: [
                ...g.members,
                {
                  id: `temp-${Date.now()}`,
                  student: studentToMove!,
                  groupId: targetGroupId,
                  studentId: studentId,
                  role: "MEMBER" as const,
                  joinedAt: new Date(),
                },
              ],
            };
          }
          return g;
        })
      );
    } else {
      setStudentsWithoutGroup((prev) => [...prev, studentToMove!]);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (
      !destination ||
      (destination.droppableId === source.droppableId && destination.index === source.index)
    ) {
      return;
    }

    const studentId = draggableId;
    const sourceGroupId = source.droppableId === "unassigned" ? null : source.droppableId;
    const targetGroupId = destination.droppableId === "unassigned" ? null : destination.droppableId;

    if (targetGroupId) {
      const targetGroup = groups.find((g) => g.id === targetGroupId);
      if (targetGroup?.maxSize && targetGroup.members.length >= targetGroup.maxSize) {
        toast.error(`Nhóm đã đầy (tối đa ${targetGroup.maxSize} thành viên)`);
        return;
      }
    }

    try {
      await groupService.updateGroupMembers({
        studentId,
        targetGroupId,
        classCode,
      });

      updateUIAfterDrop(studentId, sourceGroupId, targetGroupId);
      toast.success(targetGroupId ? "Đã thêm vào nhóm" : "Đã loại khỏi nhóm");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật nhóm");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }

    try {
      const createdGroup = await groupService.createGroup({
        name: newGroupName.trim(),
        classCode,
        color: groupColors[selectedColor as keyof typeof groupColors],
        maxSize: maxGroupSize,
      });

      setGroups((prev) => [...prev, createdGroup]);
      setNewGroupName("");
      setMaxGroupSize(null);
      setIsCreatingGroup(false);
      toast.success("Tạo nhóm thành công!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo nhóm");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (
      !confirm("Bạn có chắc chắn muốn xóa nhóm này? Các thành viên sẽ trở về danh sách chưa phân nhóm.")
    ) {
      return;
    }

    try {
      await groupService.deleteGroup(groupId);

      const deletedGroup = groups.find((g) => g.id === groupId);
      if (deletedGroup && deletedGroup.members.length > 0) {
        const membersToMove = deletedGroup.members.map((member) => member.student);
        setStudentsWithoutGroup((prev) => [...prev, ...membersToMove]);
      }

      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      toast.success("Xóa nhóm thành công!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa nhóm");
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* ── TOP HEADER CARD ── */}
          <div className="bg-white rounded-3xl border border-border shadow-sm p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent text-primary flex items-center justify-center shadow-2xs flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                  Phân chia nhóm học tập
                </h1>
                <p className="text-xs sm:text-sm text-secondary">
                  Kéo thả học sinh giữa các nhóm để phân công làm bài tập và thảo luận
                </p>
              </div>
            </div>

            {isTeacher && (
              <button
                type="button"
                onClick={() => setIsCreatingGroup(true)}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer self-stretch sm:self-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo nhóm mới</span>
              </button>
            )}
          </div>

          {/* ── MAIN CONTENT: 2 COLUMNS (Unassigned vs Groups Grid) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* CỘT TRÁI: HỌC SINH CHƯA PHÂN NHÓM */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-border lg:sticky lg:top-24 text-foreground space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/70">
                  <h3 className="font-heading font-bold text-foreground text-sm sm:text-base">
                    Chưa phân nhóm
                  </h3>
                  <span className="bg-muted text-secondary text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {studentsWithoutGroup.length}
                  </span>
                </div>

                <Droppable droppableId="unassigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2.5 min-h-[380px] max-h-[calc(100vh-250px)] overflow-y-auto p-2.5 rounded-2xl border-2 border-dashed transition-all scrollbar-thin ${
                        snapshot.isDraggingOver
                          ? "border-primary bg-accent/40"
                          : "border-border bg-card/50"
                      }`}
                    >
                      {studentsWithoutGroup.map((student, index) => (
                        <Draggable key={student.id} draggableId={student.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center gap-2.5 p-2.5 sm:p-3 bg-white rounded-2xl border border-border cursor-grab active:cursor-grabbing transition-all ${
                                snapshot.isDragging
                                  ? "shadow-xl ring-2 ring-primary rotate-1 z-50"
                                  : "shadow-2xs hover:border-primary/40"
                              }`}
                              style={provided.draggableProps.style}
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-border shadow-2xs">
                                <Image
                                  path={student.img || "/avatar.png"}
                                  alt={student.username}
                                  w={48}
                                  h={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs sm:text-sm font-bold text-foreground truncate min-w-0 flex-1">
                                {student.username}
                              </p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {studentsWithoutGroup.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs text-center p-4 font-medium">
                          <Check className="w-6 h-6 text-emerald-600 mb-1.5" />
                          <span>Tất cả học sinh đã được phân nhóm</span>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* CỘT PHẢI: LƯỚI DANH SÁCH CÁC NHÓM */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-border flex flex-col text-foreground transition-all hover:shadow-md"
                  >
                    {/* Header Nhóm */}
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border/70">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-2xs flex-shrink-0 ring-2 ring-white"
                          style={{ backgroundColor: group.color || "#2b5938" }}
                        />
                        <h4 className="font-heading font-bold text-foreground text-sm sm:text-base truncate">
                          {group.name}
                        </h4>
                      </div>

                      {isTeacher && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Xóa nhóm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Số lượng thành viên */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-3 font-medium">
                      <span>Thành viên</span>
                      <span
                        className={`font-bold ${
                          group.maxSize && group.members.length >= group.maxSize
                            ? "text-rose-600"
                            : "text-foreground"
                        }`}
                      >
                        {group.members.length}
                        {group.maxSize ? `/${group.maxSize}` : ""}
                      </span>
                    </div>

                    {/* Vùng thả thành viên */}
                    <Droppable droppableId={group.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 space-y-2.5 min-h-[170px] p-2.5 rounded-2xl border-2 border-dashed transition-all scrollbar-thin ${
                            snapshot.isDraggingOver
                              ? "border-primary bg-accent/40"
                              : "border-border bg-card/40"
                          }`}
                        >
                          {group.members.map((member, index) => (
                            <Draggable
                              key={member.student.id}
                              draggableId={member.student.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`flex items-center gap-2.5 p-2 bg-white rounded-2xl border border-border cursor-grab active:cursor-grabbing transition-all ${
                                    snapshot.isDragging
                                      ? "shadow-xl rotate-1 z-50 ring-2 ring-primary"
                                      : "shadow-2xs hover:border-primary/40"
                                  }`}
                                  style={provided.draggableProps.style}
                                >
                                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-border shadow-2xs">
                                    <Image
                                      path={member.student.img || "/avatar.png"}
                                      alt={member.student.username}
                                      w={40}
                                      h={40}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <p className="text-xs font-bold text-foreground truncate min-w-0 flex-1">
                                    {member.student.username}
                                  </p>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {group.members.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground text-xs font-medium">
                              <UserPlus className="w-5 h-5 text-muted-foreground/50 mb-1" />
                              <span>Kéo học sinh vào đây</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}

                {/* Empty State */}
                {groups.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-border border-dashed shadow-sm text-foreground text-center p-6">
                    <div className="w-16 h-16 rounded-3xl bg-accent text-primary flex items-center justify-center mb-4 shadow-2xs">
                      <Users className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-foreground mb-1">
                      Chưa có nhóm học tập nào
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-sm">
                      {isTeacher
                        ? "Tạo các nhóm học tập để chia nhỏ lớp học phục vụ làm đồ án, thảo luận và làm bài tập theo nhóm."
                        : "Giáo viên hiện chưa tạo nhóm nào cho lớp học này."}
                    </p>
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingGroup(true)}
                        className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-2xl font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        + Tạo nhóm ngay
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── CREATE GROUP MODAL ── */}
        {isCreatingGroup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl max-w-md w-full border border-border text-foreground animate-in fade-in zoom-in-95 duration-150 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <h3 className="text-lg font-heading font-bold text-foreground">Tạo nhóm học mới</h3>
                <button
                  type="button"
                  onClick={() => setIsCreatingGroup(false)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Tên nhóm</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="VD: Nhóm 1, Nhóm A, Nhóm Dự Án..."
                    className="w-full px-4 py-2.5 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground text-xs sm:text-sm font-medium transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Màu đại diện nhóm</label>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(groupColors).map(([name, color]) => (
                      <button
                        key={name}
                        onClick={() => setSelectedColor(name)}
                        className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                          selectedColor === name
                            ? "ring-2 ring-offset-2 ring-primary scale-110 shadow-sm"
                            : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: color }}
                        title={name}
                        type="button"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Số thành viên tối đa (tùy chọn)
                  </label>
                  <input
                    type="number"
                    value={maxGroupSize || ""}
                    onChange={(e) =>
                      setMaxGroupSize(e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="Để trống nếu không giới hạn"
                    min="1"
                    className="w-full px-4 py-2.5 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground text-xs sm:text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingGroup(false)}
                  className="flex-1 px-4 py-2.5 bg-muted text-foreground hover:bg-muted/80 font-semibold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  Tạo nhóm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export default ClassGroupsPageSimple;