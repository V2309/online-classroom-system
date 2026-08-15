"use client";

import { useState } from "react";
import Image from "next/image";
import { PendingMemberRequest } from "@/types/class";
import { classService } from "@/services/class.service";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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
        toast.success("Đã từ chối.");
      }
      router.refresh(); // Làm mới dữ liệu trang
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
    <div className="bg-white p-4 border-l  shadow-sm h-full">
      <h2 className="text-md font-semibold text-gray-800  pb-3">
        Chờ duyệt • {requests.length}
      </h2>

      {requests.length > 0 ? (
        <div className="space-y-4 mt-4">
          {/* Nút tổng */}
          <div className="space-y-2">
            <button
              onClick={handleApproveAll}
              disabled={loading}
              className="w-full px-2 text-sm py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              Phê duyệt tất cả
            </button>
            <button
              onClick={handleRejectAll}
              disabled={loading}
              className="w-full px-2 text-sm py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              Từ chối tất cả
            </button>
          </div>

          <div className="border-t pt-4 space-y-3">
            {/* Danh sách chờ */}
            {requests.map((req) => (
              <div key={req.id} className="p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={
                      req.student.img
                        ? `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${req.student.img}`
                        : "/avatar.png" // Đường dẫn đến ảnh mặc định trong thư mục /public
                    }
                    alt={req.student.username}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="font-medium text-gray-900">
                    {req.student.username}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleAction("approve", req.id, req.studentId)
                    }
                    disabled={loading}
                    className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() =>
                      handleAction("reject", req.id, req.studentId)
                    }
                    disabled={loading}
                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-10">
          Không có yêu cầu nào đang chờ.
        </p>
      )}
    </div>
  );
}
