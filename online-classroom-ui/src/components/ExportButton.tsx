"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Download, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface ExportButtonProps {
  studentScores: any[];
  homeworks: any[];
  className?: string;
}

export default function ExportButton({
  studentScores,
  homeworks,
  className = "",
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    if (!studentScores || studentScores.length === 0) {
      toast.warn("Không có dữ liệu để xuất file!");
      return;
    }

    setLoading(true);
    toast.info("Đang xuất file Excel...");

    try {
      // 1. Tạo Tiêu đề (Header)
      const headers = [
        "STT",
        "Họ và tên",
        "Lớp",
        "Trường",
        "Điểm Trung Bình",
        ...homeworks.map((h) => `${h.title} (${h.points || 10}đ)`),
      ];

      // 2. Tạo các hàng dữ liệu (Body)
      const body = studentScores.map((student, index) => [
        index + 1,
        student.username,
        student.class_name || "-",
        student.schoolname || "-",
        student.average ? Number(student.average).toFixed(1) : "-",
        ...homeworks.map((h) => student.homeworkScores[h.id] ?? "-"),
      ]);

      // 3. Gộp Header và Body
      const dataToExport = [headers, ...body];

      // 4. Tạo file Excel
      const ws = XLSX.utils.aoa_to_sheet(dataToExport);

      // Auto set column widths
      const colWidths = headers.map((header) => ({
        wch: Math.max(header.length + 4, 12),
      }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bảng điểm");

      // 5. Tải file
      XLSX.writeFile(wb, `bang_diem_${new Date().toISOString().slice(0, 10)}.xlsx`);

      toast.success("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Lỗi khi xuất Excel:", err);
      toast.error("Xuất file thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover disabled:opacity-50 rounded-2xl shadow-2xs transition-all active:scale-95 cursor-pointer ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{loading ? "Đang xuất..." : "Xuất Excel"}</span>
    </button>
  );
}
