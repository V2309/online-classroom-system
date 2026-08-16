"use client";

import { ITEM_PER_PAGE } from "@/lib/setting";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  count: number;
  itemPerPage?: number;
  label?: string;
}

const Pagination = ({
  page,
  count,
  itemPerPage = ITEM_PER_PAGE,
  label = "kết quả",
}: PaginationProps) => {
  const router = useRouter();

  const totalPages = Math.ceil(count / itemPerPage) || 1;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const startItem = count === 0 ? 0 : (page - 1) * itemPerPage + 1;
  const endItem = Math.min(page * itemPerPage, count);

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // Logic tạo danh sách số trang có dấu ba chấm (...)
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 3) {
      return [1, 2, 3, "...", totalPages];
    }

    if (page >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", page, "...", totalPages];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-foreground py-2 select-none">
      {/* Thông tin số lượng hiển thị bên trái */}
      <div className="text-xs sm:text-sm text-muted-foreground">
        Hiển thị <span className="font-bold text-foreground">{startItem}</span> đến{" "}
        <span className="font-bold text-foreground">{endItem}</span> trong số{" "}
        <span className="font-bold text-foreground">{count}</span> {label}
      </div>

      {/* Cụm điều khiển phân trang bên phải */}
      <div className="flex items-center gap-1.5 self-center sm:self-auto">
        {/* Nút Prev */}
        <button
          disabled={!hasPrev}
          onClick={() => changePage(page - 1)}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-2xs active:scale-95"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Danh sách các số trang */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (typeof p === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 sm:w-8 h-8 sm:h-9 flex items-center justify-center text-muted-foreground text-xs sm:text-sm font-medium"
                >
                  ...
                </span>
              );
            }

            const isActive = p === page;
            return (
              <button
                key={`page-${p}`}
                onClick={() => changePage(p)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-xs scale-105"
                    : "text-foreground hover:bg-muted/70 active:scale-95"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Nút Next */}
        <button
          disabled={!hasNext}
          onClick={() => changePage(page + 1)}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-2xs active:scale-95"
          aria-label="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;