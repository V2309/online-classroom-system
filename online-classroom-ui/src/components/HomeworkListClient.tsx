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

  // Reset selected khi homework hiện tại không còn trong danh sách (bị xóa)
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

  // outside click to close
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

  // helpers
  const getDate = (hw: any) =>
    new Date(hw?.createdAt || hw?.created_at || hw?.updatedAt || 0).getTime();
  const getTitle = (hw: any) =>
    (hw?.title || hw?.name || "").toString().toLowerCase();

  // sort list
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
    <div className="flex flex-col overflow-hidden">
      {/* Vùng nội dung 2 cột */}
      <div className="flex flex-1 overflow-hidden">
        {/* Cột danh sách */}
        <div className="flex-1 md:w-2/3 overflow-y-auto border-r border-gray-400">
          {/* Thanh công cụ NẰM TRONG danh sách + sticky */}
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-4 py-3 border-b  border-gray-400" >
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
              {/* Search (trung tâm/đầu hàng) */}
              <div className="sm:order-1">
                <TableSearch />
              </div>

              {/* Sort dropdown (bên phải) */}
              <div className="sm:order-2 justify-self-end" ref={dropdownRef}>
                <div className="relative">
                  <button
                    onClick={() => setSortOpen((v) => !v)}
                    className="px-4 py-2 rounded-md font-semibold text-gray-700 border border-gray-400 w-32"
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                  >
                    {sortOptions.find((o) => o.value === sortOption)?.label ??
                      "Sắp xếp"}
                  </button>
                  {sortOpen && (
                    <div
                      role="listbox"
                      className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border z-20"
                    >
                      {sortOptions.map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() => handleSelectSort(opt.value)}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-100 hover:text-blue-600 ${
                            opt.value === sortOption
                              ? "bg-gray-50 font-medium"
                              : ""
                          }`}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tạo bài tập (bên phải) */}
              {/* kiem tra role */}
              {role === "teacher" && (
                <div className="sm:order-3 justify-self-end">
                  <Link
                    href={`/class/${class_code}/homework/add`}
                    className="px-4 py-2 rounded-md font-bold text-white bg-blue-500 hover:bg-blue-600"
                  >
                    + Tạo bài tập
                  </Link>
                </div>
              )}
            </div>
              
          </div>

     {/* Danh sách bài tập kiểm tra theo role */}
<div className="p-4">
  {sortedHomeworks.length > 0 ? (
    sortedHomeworks.map((hw) => (
      <div
        key={hw.id}
        className={`cursor-pointer ${selected?.id === hw.id ? "ring-2 ring-blue-500 rounded-md" : ""}`}
        onClick={() => setSelected(hw)}
      >
        <HomeworkCard homework={hw} role={role} />
      </div>
    ))
  ) : role === "teacher" ? (
    <div className="text-center text-gray-500 py-8">
      <p className="mb-2">Chưa có bài tập nào trong lớp này.</p>
      <p>
        Dùng nút{" "}
        <span className="font-semibold text-blue-600">+ Tạo bài tập</span>{" "}
        để đăng bài tập của bạn.
      </p>
    </div>
  ) : (
    <div className="text-center text-gray-500 py-8">
      <p>Chưa có bài tập nào trong lớp này.</p>
    </div>
  )}
</div>
        </div>

        {/* Cột chi tiết nếu không có bài tập thì ẩn */}
        <div className="w-full md:w-1/3 overflow-y-auto p-4  flex-shrink-0">
          {selected ? (
            <HomeWorkInfo homework={selected} role={role} />
          ) : (
            <div className="text-gray-500">
              Chọn một bài tập để xem chi tiết
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
