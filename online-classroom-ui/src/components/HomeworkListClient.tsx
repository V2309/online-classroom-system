// homeworklistclient.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { HomeworkCard } from "@/components/HomeworkCard";
import { HomeWorkInfo } from "@/components/HomeWorkInfo";
import Link from "next/link";
import TableSearch from "./TableSearch";

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
    if (selected && !homeworks.find(hw => hw.id === selected.id)) {
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
    { value: "az", label: "A - Z" },
    { value: "za", label: "Z - A" },
  ];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSortOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setSortOpen(false);
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
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0 w-full overflow-hidden text-foreground">
      {/* Cột 1: Danh sách bài tập (CHỈ CUỘN Ở ĐÂY) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Thanh công cụ tìm kiếm và lọc (Card trắng cố định) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-border p-4 shadow-sm mb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <TableSearch />
            </div>

            {/* Sort & Action buttons */}
            <div className="flex items-center gap-3 justify-end flex-shrink-0">
              {/* Sort dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="px-4 py-2 bg-muted hover:bg-accent rounded-xl text-xs sm:text-sm font-semibold text-foreground border border-border flex items-center gap-2 transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                >
                  <span>{sortOptions.find((o) => o.value === sortOption)?.label ?? "Sắp xếp"}</span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {sortOpen && (
                  <div
                    role="listbox"
                    className="absolute right-0 mt-2 w-36 bg-white shadow-lg rounded-xl border border-border py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectSort(opt.value)}
                        className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm transition-colors ${
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

              {/* Tạo bài tập (cho giáo viên) */}
              {role === "teacher" && (
                <Link
                  href={`/class/${class_code}/homework/add`}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>+ Tạo bài tập</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Danh sách bài tập cuộn bên trong */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin min-h-0">
          {sortedHomeworks.length > 0 ? (
            sortedHomeworks.map((hw) => (
              <div
                key={hw.id}
                className={`cursor-pointer transition-all ${
                  selected?.id === hw.id ? "ring-2 ring-primary rounded-2xl sm:rounded-3xl" : ""
                }`}
                onClick={() => setSelected(hw)}
              >
                <HomeworkCard homework={hw} role={role} />
              </div>
            ))
          ) : role === "teacher" ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-border border-dashed p-12 text-center text-muted-foreground shadow-sm">
              <div className="text-4xl mb-3 opacity-40">📝</div>
              <p className="font-semibold text-foreground mb-1">Chưa có bài tập nào trong lớp này</p>
              <p className="text-sm text-muted-foreground mb-4">Hãy tạo bài tập đầu tiên để học sinh bắt đầu làm bài.</p>
              <Link
                href={`/class/${class_code}/homework/add`}
                className="inline-flex px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-full text-sm shadow-sm"
              >
                + Tạo bài tập ngay
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-border border-dashed p-12 text-center text-muted-foreground shadow-sm">
              <div className="text-4xl mb-3 opacity-40">📝</div>
              <p className="font-semibold text-foreground">Chưa có bài tập nào được giao cho lớp này</p>
            </div>
          )}
        </div>
      </div>

      {/* Cột 2: Chi tiết bài tập (CHIỀU CAO CỐ ĐỊNH, KHÔNG SCROLL TRANG) */}
      <div className="w-full lg:w-96 xl:w-104 flex-shrink-0 h-full flex flex-col min-h-0">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-border shadow-sm p-5 sm:p-6 h-full overflow-y-auto scrollbar-thin flex flex-col">
          {selected ? (
            <HomeWorkInfo homework={selected} role={role} />
          ) : (
            <div className="text-center my-auto py-16 text-muted-foreground">
              <p className="text-4xl mb-3 opacity-40">👈</p>
              <p className="font-medium text-sm">Chọn một bài tập để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
