"use client";

import Link from "next/link";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import Table from "@/components/Table";
import { Menu, MenuItem } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import {
  FiMoreVertical,
  FiEdit,
  FiLogIn,
  FiGrid,
  FiList,
  FiUsers,
  FiArrowRight,
} from "react-icons/fi";
import { GraduationCap, Hash, User } from "lucide-react";
import { ReactNode, useState } from "react";
import ClassDeleteActions from "@/components/ClassDeleteActions";

interface ClassItem {
  id: string | number;
  name: string;
  capacity?: number;
  class_code?: string;
  img?: string;
  supervisor?: {
    id?: string;
    username?: string;
    user?: { username?: string; img?: string | null };
  } | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  _count?: { students?: number };
}

interface ClassListPageCommonProps {
  data: any[];
  count: number;
  page: number;
  role: "teacher" | "student";
  extraHeader?: ReactNode;
  viewType?: "joined" | "pending";
  currentClassCount?: number;
  showClassCount?: boolean;
}

export default function ClassListPageCommon({
  data,
  count,
  page,
  role,
  extraHeader,
  viewType = "joined",
  currentClassCount = 0,
  showClassCount = true,
}: ClassListPageCommonProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const columns = [
    {
      header: "Tên lớp học",
      accessor: "name",
      className: "p-4",
    },
    {
      header: "Mã lớp",
      accessor: "class_code",
      className: "hidden md:table-cell",
    },
    {
      header: "Giáo viên phụ trách",
      accessor: "supervisor",
      className: "hidden lg:table-cell",
    },
    {
      header: "Sĩ số",
      accessor: "studentCount",
      className: "hidden lg:table-cell",
    },
    {
      header: "Thao tác",
      accessor: "action",
      className: "text-right p-4",
    },
  ];

  const renderRow = (item: ClassItem) => (
    <tr
      key={item.id}
      className="border-b border-border text-sm hover:bg-muted/40 transition-colors"
    >
      <td className="flex items-center gap-3.5 p-4">
        <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-muted relative shadow-2xs">
          <Image
            src={item.img || "/school.jpg"}
            alt={item.name || "Class cover"}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <Link
            href={`/class/${item.class_code || item.id}/newsfeed`}
            className="font-bold text-foreground hover:text-primary transition-colors truncate"
          >
            {item.name}
          </Link>
          {item.deleted && (
            <span className="text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full w-fit mt-1">
              Đã xóa
            </span>
          )}
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className="font-mono text-xs font-bold bg-muted px-2.5 py-1 rounded-lg text-foreground border border-border/50">
          {item.class_code || "—"}
        </span>
      </td>
      <td className="hidden lg:table-cell text-secondary font-medium">
        {item.supervisor?.user?.username ||
          item.supervisor?.username ||
          "Chưa phân công"}
      </td>
      <td className="hidden lg:table-cell">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-accent text-primary">
          <FiUsers className="w-3 h-3" />
          <span>{item._count?.students || 0} học sinh</span>
        </span>
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {item.deleted ? (
            <ClassDeleteActions
              classId={item.id as number}
              isDeleted={true}
            />
          ) : (
            <>
              <Link
                href={`/class/${item.class_code || item.id}/newsfeed`}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-accent hover:bg-primary text-primary hover:text-primary-foreground transition-all shadow-2xs active:scale-95"
                title="Vào lớp học"
              >
                <FiLogIn className="w-4 h-4" />
              </Link>
              {role === "teacher" && (
                <>
                  <Link
                    href={`/class/${item.class_code || item.id}/edit`}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted hover:bg-accent text-foreground transition-all shadow-2xs active:scale-95"
                    title="Cài đặt lớp"
                  >
                    <FiEdit className="w-4 h-4" />
                  </Link>
                  <ClassDeleteActions
                    classId={item.id as number}
                    isDeleted={false}
                  />
                </>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="w-full h-full min-h-0 flex flex-col p-4 sm:p-6 lg:p-8 bg-background text-foreground overflow-y-auto scrollbar-thin">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* ================= HEADER TRÊN CÙNG ================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
                {viewType === "pending" ? "Lớp học đang chờ duyệt" : "Lớp học của bạn"}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-secondary pl-11">
              Quản lý và truy cập vào các không gian học tập trực tuyến
            </p>
          </div>

          {/* Action Tools Toolbar */}
          <div className="flex items-center gap-3 flex-wrap justify-start lg:justify-end">
            {extraHeader}

            {/* Teacher Quota bar */}
            {role === "teacher" && showClassCount && (
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-white rounded-2xl border border-border shadow-2xs">
                <span className="text-xs font-bold text-foreground">
                  {currentClassCount}/10 lớp
                </span>
                <div className="w-20 sm:w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentClassCount >= 10
                        ? "bg-destructive"
                        : currentClassCount >= 7
                        ? "bg-amber-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${(currentClassCount / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Student Join Button */}
            {role === "student" && (
              <Link
                href="/join"
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <span>+ Tham gia lớp học</span>
              </Link>
            )}
          </div>
        </div>

        {/* ================= SEARCH & VIEW MODE BAR ================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-border shadow-sm">
          <div className="flex-1 max-w-md">
            <TableSearch placeholder="Tìm kiếm theo tên lớp, mã lớp..." />
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* Toggle View Mode */}
            <div className="flex items-center bg-muted/80 rounded-xl p-1 border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-white shadow-2xs text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Dạng lưới thẻ"
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-white shadow-2xs text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Dạng danh sách"
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= GRID VIEW ================= */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {data?.length ? (
              data.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-3xl border border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col overflow-hidden text-foreground"
                >
                  {/* Cover Banner */}
                  <Link
                    href={`/class/${item.class_code || item.id}/newsfeed`}
                    className="relative h-44 w-full overflow-hidden block bg-muted flex-shrink-0"
                  >
                    <Image
                      src={item.img || "/school.jpg"}
                      alt={item.name || "Class cover"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* Sĩ số học sinh Badge */}
                    <span className="absolute bottom-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-full bg-black/40 backdrop-blur-md flex items-center gap-1.5">
                      <FiUsers className="w-3.5 h-3.5" />
                      <span>{item._count?.students || 0} học sinh</span>
                    </span>
                  </Link>

                  {/* Menu Options Button at Top Right */}
                  <div className="absolute right-3 top-3 z-10">
                    {item.deleted ? (
                      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1 px-2.5 rounded-full border border-border shadow-sm">
                        <span className="text-[11px] font-bold text-destructive">
                          Đã xóa
                        </span>
                        <ClassDeleteActions
                          classId={item.id as number}
                          isDeleted={true}
                        />
                      </div>
                    ) : (
                      <Menu
                        menuButton={
                          <button
                            aria-label="More actions"
                            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm hover:bg-white border border-border flex items-center justify-center text-foreground transition-all active:scale-95"
                          >
                            <FiMoreVertical className="w-4 h-4" />
                          </button>
                        }
                        transition
                        menuClassName="rounded-2xl border border-border shadow-xl p-1 bg-white text-foreground"
                      >
                        <MenuItem className="rounded-xl hover:bg-muted text-xs font-semibold py-2">
                          <Link
                            href={`/class/${item.class_code || item.id}/newsfeed`}
                            className="flex items-center gap-2 text-foreground"
                          >
                            <FiLogIn className="w-4 h-4 text-primary" /> Vào lớp học
                          </Link>
                        </MenuItem>
                        {role === "teacher" && (
                          <MenuItem className="rounded-xl hover:bg-muted text-xs font-semibold py-2">
                            <Link
                              href={`/class/${item.class_code || item.id}/edit`}
                              className="flex items-center gap-2 text-foreground"
                            >
                              <FiEdit className="w-4 h-4 text-state-success" /> Chỉnh sửa
                            </Link>
                          </MenuItem>
                        )}
                        {role === "teacher" && (
                          <MenuItem className="rounded-xl hover:bg-destructive/10 text-xs font-semibold py-2">
                            <ClassDeleteActions
                              classId={item.id as number}
                              isDeleted={false}
                            />
                          </MenuItem>
                        )}
                      </Menu>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <Link
                        href={`/class/${item.class_code || item.id}/newsfeed`}
                        className="block"
                      >
                        <h3 className="font-heading text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                          {item.name}
                        </h3>
                      </Link>

                      <div className="mt-2.5 space-y-1.5 text-xs text-secondary">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">
                            <span className="font-semibold text-foreground">GV:</span>{" "}
                            {item.supervisor?.user?.username ||
                              item.supervisor?.username ||
                              "Chưa phân công"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span>
                            <span className="font-semibold text-foreground">Mã:</span>{" "}
                            <span className="font-mono font-bold text-foreground">
                              {item.class_code || "—"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <Link
                        href={`/class/${item.class_code || item.id}/newsfeed`}
                        className="inline-flex items-center gap-1.5 font-bold text-primary group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Vào lớp học</span>
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-3xl border border-border border-dashed p-12 text-center text-muted-foreground shadow-sm">
                <div className="text-4xl mb-3 opacity-40">🏫</div>
                <p className="font-bold text-foreground text-base mb-1">
                  Chưa có lớp học nào
                </p>
                <p className="text-sm text-muted-foreground">
                  {role === "teacher"
                    ? "Hãy tạo lớp học mới để bắt đầu giảng dạy."
                    : "Hãy dùng mã lớp để tham gia lớp học."}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ================= LIST VIEW (TABLE) ================= */
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            {data?.length ? (
              <Table columns={columns} renderRow={renderRow} data={data} />
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-4xl mb-3 opacity-40">🏫</div>
                <p className="font-bold text-foreground text-base">
                  Chưa có lớp học nào
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= PAGINATION ================= */}
        <div className="pt-2">
          <Pagination count={count} page={page} label="lớp học" />
        </div>
      </div>
    </div>
  );
}
