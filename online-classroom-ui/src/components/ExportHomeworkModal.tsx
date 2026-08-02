"use client";
import { useState } from "react";
import { saveAs } from "file-saver";

export default function ExportHomeworkModal({ homeworkId, open, onClose }: { homeworkId: number, open: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    const res = await fetch(`/api/homework/${homeworkId}/export`);
    const blob = await res.blob();
    saveAs(blob, `homework_${homeworkId}_export.xlsx`);
    setLoading(false);
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Xác nhận xuất dữ liệu</h2>
        <p>Bạn có chắc chắn muốn xuất dữ liệu nộp bài của bài tập này ra file Excel?</p>
        <div className="flex justify-end gap-2 mt-6">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose} disabled={loading}>Hủy</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleExport} disabled={loading}>
            {loading ? "Đang xuất..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
} 