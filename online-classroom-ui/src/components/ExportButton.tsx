"use client";

import { useState } from 'react';
import * as XLSX from 'xlsx'; // Import thư viện xlsx
import { Download } from 'lucide-react';
import { toast } from 'react-toastify'; // Giả sử bạn dùng react-toastify

// Vì chúng ta không thể import type từ Server Component, 
// chúng ta sẽ nhận props là 'any' hoặc định nghĩa lại type cơ bản.
// Ở đây dùng `any` cho đơn giản, vì đây là component nội bộ.
interface ExportButtonProps {
  studentScores: any[];
  homeworks: any[];
  className?: string;
}

export default function ExportButton({ studentScores, homeworks, className }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    setLoading(true);
    toast.info("Đang chuẩn bị file Excel...");

    try {
      // 1. Tạo Tiêu đề (Header)
      const headers = [
        "STT", 
        "Họ và tên", 
        "Trung Bình",
        ...homeworks.map(h => h.title) // Lấy tên các bài tập
      ];

      // 2. Tạo các hàng dữ liệu (Body)
      const body = studentScores.map((student, index) => [
        index + 1,
        student.username,
        student.average.toFixed(1),
        ...homeworks.map(h => student.homeworkScores[h.id] ?? '-') // Lấy điểm hoặc '-'
      ]);

      // 3. Gộp Header và Body
      const dataToExport = [headers, ...body];

      // 4. Tạo file Excel
      const ws = XLSX.utils.aoa_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bảng điểm"); // Đặt tên sheet là "Bảng điểm"

      // 5. Tải file
      XLSX.writeFile(wb, "bang_diem.xlsx"); // Tên file tải về

      setLoading(false);

    } catch (err) {
      console.error("Lỗi khi xuất Excel:", err);
      toast.error("Xuất file thất bại!");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors ${className}`}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Download size={16} />
      )}
      <span>{loading ? "Đang xử lý..." : "Tải xuống (Excel)"}</span>
    </button>
  );
}
