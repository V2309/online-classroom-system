"use client";

import { useState } from "react";
import Image from "@/components/Image";
import { PendingMemberRequest } from "@/types/class";
import { classService } from "@/services/class.service";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { UserCheck, Check, X, ShieldCheck, CheckCheck, Ban, Clock } from "lucide-react";

interface ApprovalSidebarProps {
  requests: PendingMemberRequest[];
  classCode: string;
}

export default function ApprovalSidebar({
  requests,
  classCode,
}: ApprovalSidebarProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAction = async (
    action: "approve" | "reject",
    requestId: number,
    studentId: string
  ) => {
    setLoading(true);
    try {
      if (action === "approve") {
        await classService.approveJoinRequest(requestId);
        toast.success("Đã phê duyệt học sinh vào lớp!");
      } else {
        await classService.rejectJoinRequest(requestId);
        toast.success("Đã từ chối yêu cầu tham gia.");
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi máy chủ, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAll = async () => {
    if (requests.length === 0) {
      toast.info("Không có yêu cầu nào để phê duyệt.");
      return;
    }
    setLoading(true);
    try {
      for (const req of requests) {
        await classService.approveJoinRequest(req.id);
      }
      toast.success("Đã phê duyệt tất cả học sinh!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi phê duyệt hàng loạt.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAll = async () => {
    if (requests.length === 0) {
      toast.info("Không có yêu cầu nào để từ chối.");
      return;
    }
    setLoading(true);
    try {
      for (const req of requests) {
        await classService.rejectJoinRequest(req.id);
      }
      toast.success("Đã từ chối tất cả yêu cầu.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi từ chối hàng loạt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-border shadow-sm p-5 sm:p-6 text-foreground h-full flex flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-border/70 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent text-primary flex items-center justify-center shadow-2xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-heading font-bold text-foreground">
              Chờ phê duyệt
            </h2>
            <p className="text-[11px] text-secondary">Yêu cầu tham gia lớp học</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
          {requests.length}
        </span>
      </div>

      {requests.length > 0 ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden pt-4 space-y-4">
          {/* Nút hành động hàng loạt */}
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleApproveAll}
              disabled={loading}
              className="py-2.5 px-3 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl text-xs transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Duyệt tất cả</span>
            </button>
            <button
              type="button"
              onClick={handleRejectAll}
              disabled={loading}
              className="py-2.5 px-3 bg-muted hover:bg-muted/80 text-secondary font-semibold rounded-2xl text-xs transition-all border border-border flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Từ chối tất cả</span>
            </button>
          </div>

          {/* Danh sách thẻ chờ duyệt */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin pr-1 space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-card/60 rounded-2xl border border-border/80 shadow-2xs hover:border-primary/40 transition-all space-y-3"
              >
                {/* Thông tin học sinh xin tham gia */}
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border shadow-2xs">
                    <Image
                      path={req.student.img || "/avatar.png"}
                      alt={req.student.username}
                      w={80}
                      h={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-foreground text-sm leading-tight truncate">
                      {req.student.username}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {(req.student as any).email ||
                        `${req.student.username.toLowerCase().replace(/\s+/g, "")}@student.docus.edu`}
                    </p>
                  </div>
                </div>

                {/* Hai nút thao tác: Từ chối & Duyệt */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAction("reject", req.id, req.studentId)}
                    disabled={loading}
                    className="flex-1 py-2 px-3 bg-white hover:bg-muted text-secondary font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 border border-border cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5 text-secondary" />
                    <span>Từ chối</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction("approve", req.id, req.studentId)}
                    disabled={loading}
                    className="flex-1 py-2 px-3 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    <span>Chấp nhận</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground my-auto">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/50 mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Không có yêu cầu chờ duyệt</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            Học sinh xin vào lớp sẽ xuất hiện tại đây để bạn xét duyệt.
          </p>
        </div>
      )}
    </div>
  );
}
