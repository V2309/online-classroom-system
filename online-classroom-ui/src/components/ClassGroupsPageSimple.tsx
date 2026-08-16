'use client';

import { useState } from 'react';
import Image from '@/components/Image';
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ClassGroupItem, StudentWithoutGroup } from '@/types/group';
import { groupService } from '@/services/group.service';
import ClassPageHeader from '@/components/ClassPageHeader';

interface ClassGroupsPageProps {
  classCode: string;
  className: string;
  userRole: string;
  groups: ClassGroupItem[];
  studentsWithoutGroup: StudentWithoutGroup[];
  isTeacher: boolean;
}

const groupColors = {
  'blue': '#3B82F6',
  'green': '#10B981',
  'red': '#EF4444',
  'purple': '#8B5CF6',
  'yellow': '#F59E0B',
  'pink': '#EC4899',
  'indigo': '#6366F1',
  'teal': '#14B8A6',
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
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [maxGroupSize, setMaxGroupSize] = useState<number | null>(null);

  // Xử lý logic cập nhật UI sau khi kéo thả
  const updateUIAfterDrop = (studentId: string, sourceGroupId: string | null, targetGroupId: string | null) => {
    let studentToMove: StudentWithoutGroup | null = null;

    // 1. Tìm và lấy thông tin student từ nguồn (source)
    if (sourceGroupId) {
      // Nếu kéo từ một nhóm
      const sourceGroup = groups.find(g => g.id === sourceGroupId);
      const member = sourceGroup?.members.find(m => m.student.id === studentId);
      if (member) {
        studentToMove = member.student;
        // Xóa khỏi nhóm cũ
        setGroups(prev => prev.map(g => {
          if (g.id === sourceGroupId) {
            return { ...g, members: g.members.filter(m => m.student.id !== studentId) };
          }
          return g;
        }));
      }
    } else {
      // Nếu kéo từ danh sách chưa phân nhóm (unassigned)
      studentToMove = studentsWithoutGroup.find(s => s.id === studentId) || null;
      if (studentToMove) {
        // Xóa khỏi danh sách unassigned
        setStudentsWithoutGroup(prev => prev.filter(s => s.id !== studentId));
      }
    }

    // Nếu không tìm thấy học sinh thì dừng
    if (!studentToMove) return;

    // 2. Thêm student vào đích (target)
    if (targetGroupId) {
      // Thêm vào nhóm mới
      setGroups(prev => prev.map(g => {
        if (g.id === targetGroupId) {
          return {
            ...g,
            members: [...g.members, {
              id: `temp-${Date.now()}`,
              student: studentToMove!,
              groupId: targetGroupId,
              studentId: studentId,
              role: 'MEMBER' as const,
              joinedAt: new Date(),
            }]
          };
        }
        return g;
      }));
    } else {
      // Trả về danh sách chưa phân nhóm
      setStudentsWithoutGroup(prev => [...prev, studentToMove!]);
    }
  };

  // Xử lý sự kiện kéo thả
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Nếu thả ra ngoài hoặc thả vào chỗ cũ thì không làm gì
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const studentId = draggableId;
    const sourceGroupId = source.droppableId === 'unassigned' ? null : source.droppableId;
    const targetGroupId = destination.droppableId === 'unassigned' ? null : destination.droppableId;

    // Kiểm tra giới hạn số lượng thành viên của nhóm đích
    if (targetGroupId) {
      const targetGroup = groups.find(g => g.id === targetGroupId);
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

      // Cập nhật UI ngay lập tức
      updateUIAfterDrop(studentId, sourceGroupId, targetGroupId);
      toast.success(targetGroupId ? "Đã thêm vào nhóm" : "Đã loại khỏi nhóm");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật nhóm");
    }
  };

  // Tạo nhóm mới
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }

    try {
      const createdGroup = await groupService.createGroup({
        name: newGroupName,
        classCode,
        color: groupColors[selectedColor as keyof typeof groupColors],
        maxSize: maxGroupSize,
      });

      setGroups(prev => [...prev, createdGroup]);
      setNewGroupName('');
      setIsCreatingGroup(false);
      toast.success("Tạo nhóm thành công");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo nhóm");
    }
  };

  // Xóa nhóm
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này? Các thành viên sẽ trở về danh sách chưa phân nhóm.')) {
      return;
    }

    try {
      await groupService.deleteGroup(groupId);

      // Di chuyển tất cả thành viên của nhóm về danh sách chưa phân nhóm
      const deletedGroup = groups.find(g => g.id === groupId);
      if (deletedGroup && deletedGroup.members.length > 0) {
        const membersToMove = deletedGroup.members.map(member => member.student);
        setStudentsWithoutGroup(prev => [...prev, ...membersToMove]);
      }

      // Xóa nhóm khỏi state
      setGroups(prev => prev.filter(g => g.id !== groupId));
      toast.success("Xóa nhóm thành công");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa nhóm");
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="bg-background min-h-screen text-foreground transition-colors">
        {/* Header */}
        <ClassPageHeader title="Phân Chia Nhóm Lớp" className="sticky top-0 z-40">
          {isTeacher && (
            <button
              onClick={() => setIsCreatingGroup(true)}
              className="px-5 py-2 bg-[#3f6d4d] hover:bg-[#345c40] text-white rounded-full transition-all shadow-sm text-sm font-semibold flex items-center gap-1.5 active:scale-95"
            >
              + Tạo Nhóm Mới
            </button>
          )}
        </ClassPageHeader>

        {/* Create Group Modal */}
        {isCreatingGroup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white p-6 rounded-2xl sm:rounded-3xl shadow-xl max-w-md w-full mx-4 border border-[#ece7de] text-foreground animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold mb-4 text-[#1f2421]">Tạo Nhóm Mới</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Tên nhóm</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="VD: Nhóm 1, Nhóm A..."
                    className="w-full px-3.5 py-2.5 bg-[#f4efe8] border border-border rounded-xl focus:ring-1 focus:ring-primary focus:bg-white outline-none text-foreground text-sm transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Màu nhóm</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(groupColors).map(([name, color]) => (
                      <button
                        key={name}
                        onClick={() => setSelectedColor(name)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          selectedColor === name ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color }}
                        title={name}
                        type="button"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">Số thành viên tối đa (tùy chọn)</label>
                  <input
                    type="number"
                    value={maxGroupSize || ''}
                    onChange={(e) => setMaxGroupSize(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Để trống nếu không giới hạn"
                    min="1"
                    className="w-full px-3.5 py-2.5 bg-[#f4efe8] border border-border rounded-xl focus:ring-1 focus:ring-primary focus:bg-white outline-none text-foreground text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 px-4 py-2.5 bg-[#3f6d4d] hover:bg-[#345c40] text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
                >
                  Tạo Nhóm
                </button>
                <button
                  onClick={() => setIsCreatingGroup(false)}
                  className="px-4 py-2.5 bg-muted text-foreground hover:bg-accent rounded-xl transition-colors text-sm font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 sm:p-6">
          
          {/* Unassigned Students Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-sm border border-[#ece7de] sticky top-24 text-foreground">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#1f2421] text-base">
                  Chưa phân nhóm
                </h3>
                <span className="bg-[#f4ede3] text-[#554e42] text-xs font-semibold px-2.5 py-1 rounded-full">
                  {studentsWithoutGroup.length}
                </span>
              </div>
              
              <Droppable droppableId="unassigned">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2.5 min-h-[400px] max-h-[calc(100vh-220px)] overflow-y-auto p-2.5 rounded-2xl border-2 border-dashed transition-colors scrollbar-thin ${
                      snapshot.isDraggingOver 
                        ? 'border-primary bg-accent/30' 
                        : 'border-[#e6dfd5] bg-[#faf6f0]/60'
                    }`}
                  >
                    {studentsWithoutGroup.map((student, index) => (
                      <Draggable key={student.id} draggableId={student.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-[#ece7de] cursor-grab active:cursor-grabbing transition-all ${
                              snapshot.isDragging
                                ? 'shadow-lg ring-2 ring-primary rotate-1 z-50'
                                : 'shadow-2xs hover:shadow-sm hover:border-primary/40'
                            }`}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div className="text-muted-foreground text-xs select-none">⋮⋮</div>
                            <Image
                              path={student.img || "/avatar.png"}
                              alt={student.username}
                              w={32}
                              h={32}
                              className="w-8 h-8 rounded-full object-cover border border-border flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {student.username}
                              </p>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {studentsWithoutGroup.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm text-center px-4 font-medium">
                        Tất cả học sinh đã có nhóm
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* Groups Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-sm border border-[#ece7de] flex flex-col h-full text-foreground transition-all">
                  
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#f0ebe3]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-3.5 h-3.5 rounded-full shadow-2xs flex-shrink-0 ring-1 ring-black/10"
                        style={{ backgroundColor: group.color || '#3B82F6' }}
                      />
                      <h4 className="font-bold text-[#1f2421] text-base truncate" title={group.name}>
                        {group.name}
                      </h4>
                    </div>
                    
                    {isTeacher && (
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-destructive/10 transition-colors"
                        title="Xóa nhóm"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Member Count */}
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-2.5 px-1 font-medium">
                    <span>Thành viên</span>
                    <span className={`${
                      group.maxSize && group.members.length >= group.maxSize ? 'text-destructive font-bold' : 'font-semibold text-foreground'
                    }`}>
                      {group.members.length}{group.maxSize ? `/${group.maxSize}` : ''}
                    </span>
                  </div>

                  {/* Members List - Droppable */}
                  <Droppable droppableId={group.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 space-y-2.5 min-h-[160px] p-2.5 rounded-2xl border-2 border-dashed transition-colors scrollbar-thin ${
                          snapshot.isDraggingOver 
                            ? 'border-[#3f6d4d] bg-[#e5eee8]/50' 
                            : 'border-[#e6dfd5] bg-[#faf6f0]/60'
                        }`}
                      >
                        {group.members.map((member, index) => (
                          <Draggable key={member.student.id} draggableId={member.student.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-[#ece7de] cursor-grab active:cursor-grabbing transition-all ${
                                  snapshot.isDragging
                                    ? 'shadow-lg rotate-1 z-50 ring-1 ring-primary'
                                    : 'shadow-2xs hover:shadow-sm hover:border-primary/40'
                                }`}
                                style={provided.draggableProps.style}
                              >
                                <div className="text-muted-foreground text-xs select-none">⋮⋮</div>
                                <Image
                                  path={member.student.img || "/avatar.png"}
                                  alt={member.student.username}
                                  w={28}
                                  h={28}
                                  className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {member.student.username}
                                  </p>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {group.members.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground text-sm font-medium">
                            <span className="text-2xl mb-1 opacity-70">👥</span>
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
                <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl sm:rounded-3xl border border-[#ece7de] border-dashed shadow-sm text-foreground">
                  <div className="text-5xl mb-4 opacity-30">👥</div>
                  <h3 className="text-lg font-bold text-[#1f2421] mb-2">Chưa có nhóm nào</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                    {isTeacher 
                      ? 'Hãy tạo nhóm mới để bắt đầu chia nhóm và quản lý hoạt động lớp học' 
                      : 'Giáo viên chưa tạo nhóm nào cho lớp này'
                    }
                  </p>
                  {isTeacher && (
                    <button
                      onClick={() => setIsCreatingGroup(true)}
                      className="px-6 py-2.5 bg-[#3f6d4d] hover:bg-[#345c40] text-white rounded-full transition-all font-semibold text-sm shadow-sm"
                    >
                      + Tạo Nhóm Ngay
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default ClassGroupsPageSimple;