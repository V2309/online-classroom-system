"use client";

import { useState } from "react";
import Image from "@/components/Image";
import { PendingMemberRequest } from "@/types/class";
import { classService } from "@/services/class.service";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { UserCheck, Check, X } from "lucide-react";

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
        toast.success("Phê duyệt thành công!");
      } else {
        await classService.rejectJoinRequest(requestId);
        toast.success("Đã từ chối yêu cầu.");
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi máy chủ, vui lòng thử lại.");
    }
    setLoading(false);
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
      toast.success("Đã phê duyệt tất cả!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi phê duyệt hàng loạt.");
    }
    setLoading(false);
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
      toast.success("Đã từ chối tất cả!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi từ chối hàng loạt.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white border-l border-border shadow-sm sm:py-6 text-foreground h-full flex flex-col transition-all overflow-hidden">
      <div className="flex items-center gap-2.5 mb-4 pb-4 px-4 border-b border-border flex-shrink-0">
        <UserCheck className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">
          Chờ duyệt • {requests.length}
        </h2>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden px-4 bg-white">
          {/* Nút hành động hàng loạt */}
          <div className="space-y-2 flex-shrink-0">
            <button
              onClick={handleApproveAll}
              disabled={loading}
              className="w-full px-3 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-sm transition-colors shadow-2xs disabled:opacity-50"
            >
              Phê duyệt tất cả
            </button>
            <button
              onClick={handleRejectAll}
              disabled={loading}
              className="w-full px-3 py-2 bg-muted hover:bg-accent text-secondary font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              Từ chối tất cả
            </button>
          </div>

          <div className="border-t border-border pt-4 space-y-3 flex-1 overflow-y-auto min-h-0 scrollbar-thin pr-1 bg-white">
            {/* Danh sách chờ */}
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 sm:p-4 bg-white rounded-2xl border border-border shadow-2xs transition-all"
              >
                {/* Thông tin học sinh xin tham gia */}
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border shadow-xs">
                    <Image
                      path={req.student.img || "/avatar.png"}
                      alt={req.student.username}
                      w={80}
                      h={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-foreground text-sm sm:text-base leading-tight truncate">
                      {req.student.username}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {(req.student as any).email || `${req.student.username.toLowerCase().replace(/\s+/g, '')}@email.com`}
                    </p>
                  </div>
                </div>

                {/* Hai nút Thao tác: Reject & Approve */}
                <div className="flex items-center gap-2.5 mt-3.5">
                  <button
                    onClick={() =>
                      handleAction("reject", req.id, req.studentId)
                    }
                    disabled={loading}
                    className="flex-1 py-2 px-3 bg-muted hover:bg-accent text-secondary font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 select-none border border-border"
                  >
                    <X className="w-3.5 h-3.5 text-secondary" />
                    <span>Từ chối</span>
                  </button>
                  <button
                    onClick={() =>
                      handleAction("approve", req.id, req.studentId)
                    }
                    disabled={loading}
                    className="flex-1 py-2 px-3 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 active:scale-95 select-none"
                  >
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    <span>Duyệt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8 font-medium my-auto px-4 bg-white">
          Không có yêu cầu nào đang chờ.
        </p>
      )}
    </div>
  );
}
