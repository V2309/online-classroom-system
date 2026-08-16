"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HomeworkCard } from "@/components/HomeworkCard";
import { HomeWorkInfo } from "@/components/HomeWorkInfo";
import Link from "next/link";
import TableSearch from "./TableSearch";
import { BookOpen, Plus, ChevronDown, FileText } from "lucide-react";

type SortValue = "newest" | "oldest" | "az" | "za";

export default function HomeworkListClient({
  homeworks,
  role,
  class_code,
}: {
  homeworks: any[];
  role: string;
  class_code: string;
}) {
  const [selected, setSelected] = useState<any | null>(homeworks?.[0] || null);

  useEffect(() => {
    if (selected && !homeworks.find((hw) => hw.id === selected.id)) {
      setSelected(homeworks?.[0] || null);
    }
  }, [homeworks, selected]);

  // ---- Sort ----
  const [sortOpen, setSortOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortValue>("newest");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: { value: SortValue; label: string }[] = [
    { value: "newest", label: "Mới nhất" },
    { value: "oldest", label: "Cũ nhất" },
    { value: "az", label: "Tên A - Z" },
    { value: "za", label: "Tên Z - A" },
  ];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSortOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const getDate = (hw: any) =>
    new Date(hw?.createdAt || hw?.created_at || hw?.updatedAt || 0).getTime();
  const getTitle = (hw: any) =>
    (hw?.title || hw?.name || "").toString().toLowerCase();

  const sortedHomeworks = useMemo(() => {
    const arr = [...(homeworks || [])];
    switch (sortOption) {
      case "newest":
        return arr.sort((a, b) => getDate(b) - getDate(a));
      case "oldest":
        return arr.sort((a, b) => getDate(a) - getDate(b));
      case "az":
        return arr.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
      case "za":
        return arr.sort((a, b) => getTitle(b).localeCompare(getTitle(a)));
      default:
        return arr;
    }
  }, [homeworks, sortOption]);

  const handleSelectSort = (value: SortValue) => {
    setSortOption(value);
    setSortOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full overflow-hidden text-foreground">
      {/* ── TOP HEADER CARD (ĐỒNG BỘ CHUẨN THIẾT KẾ CÁC TRANG KHÁC) ── */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-4 sm:p-5 mb-4 flex-shrink-0 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Icon + Title + Subtitle + Count pill */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent text-primary flex items-center justify-center shadow-2xs flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-heading font-bold text-foreground leading-tight">
                Danh sách bài tập
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent text-primary">
                {homeworks.length} bài
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-secondary mt-0.5">
              Quản lý, giao đề và nộp bài tập trực tuyến
            </p>
          </div>
        </div>

        {/* Right: Search + Sort + Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap self-stretch lg:self-auto justify-between lg:justify-end">
          {/* Search box */}
          <div className="w-full sm:w-64">
            <TableSearch />
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="px-3.5 py-2 bg-card hover:bg-muted rounded-2xl text-xs sm:text-sm font-semibold text-foreground border border-border flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
            >
              <span>{sortOptions.find((o) => o.value === sortOption)?.label ?? "Sắp xếp"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {sortOpen && (
              <div
                role="listbox"
                className="absolute right-0 mt-2 w-36 bg-white shadow-xl rounded-2xl border border-border py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
              >
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectSort(opt.value)}
                    className={`w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors font-medium cursor-pointer ${
                      opt.value === sortOption
                        ? "bg-accent text-primary font-bold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nút Tạo bài tập (Cho giáo viên) */}
          {role === "teacher" && (
            <Link
              href={`/class/${class_code}/homework/add`}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-2xl text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo bài tập</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── BỐ CỤC 2 CỘT: DANH SÁCH BÀI TẬP (TRÁI) & CHI TIẾT (PHẢI) ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 overflow-hidden">
        {/* CỘT TRÁI: DANH SÁCH BÀI TẬP */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin min-h-0">
          {sortedHomeworks.length > 0 ? (
            sortedHomeworks.map((hw) => (
              <div
                key={hw.id}
                className={`cursor-pointer transition-all rounded-3xl ${
                  selected?.id === hw.id ? "ring-2 ring-primary shadow-sm" : ""
                }`}
                onClick={() => setSelected(hw)}
              >
                <HomeworkCard homework={hw} role={role} />
              </div>
            ))
          ) : role === "teacher" ? (
            <div className="bg-white rounded-3xl border border-border border-dashed p-12 text-center text-muted-foreground shadow-sm my-auto">
              <div className="w-14 h-14 rounded-3xl bg-accent text-primary flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <FileText className="w-7 h-7" />
              </div>
              <p className="font-heading font-bold text-foreground text-base mb-1">
                Chưa có bài tập nào trong lớp
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                Hãy tạo bài tập đầu tiên (trắc nghiệm hoặc tự luận) để học sinh bắt đầu làm bài.
              </p>
              <Link
                href={`/class/${class_code}/homework/add`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-2xl text-xs sm:text-sm shadow-xs hover:bg-primary-hover transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo bài tập ngay</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-border border-dashed p-12 text-center text-muted-foreground shadow-sm my-auto">
              <div className="w-14 h-14 rounded-3xl bg-muted text-muted-foreground/60 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <p className="font-heading font-bold text-foreground text-base">
                Chưa có bài tập nào được giao
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Khi giáo viên giao bài tập mới, bài tập sẽ xuất hiện tại đây.
              </p>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: CHI TIẾT BÀI TẬP ĐÃ CHỌN */}
        <div className="w-full lg:w-96 xl:w-[420px] flex-shrink-0 h-full flex flex-col min-h-0">
          <div className="bg-white rounded-3xl border border-border shadow-sm p-5 sm:p-6 h-full overflow-y-auto scrollbar-thin flex flex-col">
            {selected ? (
              <HomeWorkInfo homework={selected} role={role} />
            ) : (
              <div className="text-center my-auto py-16 text-muted-foreground">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground/60">
                  <BookOpen className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-foreground">Chưa chọn bài tập</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Chọn một bài tập ở danh sách bên trái để xem chi tiết
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
