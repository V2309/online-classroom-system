"use client";
import Link from "next/link";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import Table from "@/components/Table";
import { Menu, MenuItem } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import { FiMoreVertical, FiEdit, FiLogIn, FiTrash, FiGrid, FiList } from "react-icons/fi";
import { ReactNode, useState } from "react";
import ClassDeleteActions from "@/components/ClassDeleteActions";

interface ClassItem {
  id: string | number;
  name: string;
  capacity?: number;
  class_code?: string;
  img?: string;
  supervisor?: { username?: string } | null;
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
  currentClassCount?: number; // Số lượng lớp hiện có của giáo viên
  showClassCount?: boolean; // Có hiển thị số lượng lớp không (mặc định true)
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const columns = [
    {
      header: "Tên lớp",
      accessor: "name",
      className: "p-4",
    },
    {
      header: "Mã lớp",
      accessor: "class_code",
      className: "hidden md:table-cell",
    },
    {
      header: "Giáo viên",
      accessor: "supervisor",
      className: "hidden lg:table-cell",
    },
    {
      header: "Học sinh",
      accessor: "studentCount",
      className: "hidden lg:table-cell",
    },
    ...(role === "teacher"
      ? [
          {
            header: "Thao tác",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: ClassItem) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-blue-50"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/school.jpg"}
          alt={item.name || "Class cover"}
          width={40}
          height={40}
          className="w-10 h-10 rounded-lg object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          {item.deleted && (
            <span className="text-xs text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
              Đã xóa
            </span>
          )}
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className="font-mono text-sm">{item.class_code || "—"}</span>
      </td>
      <td className="hidden lg:table-cell">
        {item.supervisor?.username || "Chưa phân công"}
      </td>
      <td className="hidden lg:table-cell">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {item._count?.students || 0} học sinh
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {item.deleted ? (
            <ClassDeleteActions 
              classId={item.id as number} 
              isDeleted={true}
            />
          ) : (
            <>
              <Link href={`/class/${item.class_code || item.id}/newsfeed`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
                  <FiLogIn className="w-4 h-4 text-blue-600" />
                </button>
              </Link>
              {role === "teacher" && (
                <>
                  <Link href={`/class/${item.class_code || item.id}/edit`}>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 transition-colors">
                      <FiEdit className="w-4 h-4 text-green-600" />
                    </button>
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
    <div className="min-h-screen w-full flex justify-center items-start px-4 sm:px-6 lg:px-8 py-8 ">
      <div className="w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Lớp học của bạn
              </h2>
          
            </div>
          
              {extraHeader}
                  {role === "teacher" && showClassCount && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {currentClassCount}/10 lớp
                    </span>
                  </div>
                  <div className="flex-1 min-w-[120px] max-w-[200px]">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentClassCount >= 10 
                            ? 'bg-red-500' 
                            : currentClassCount >= 7 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${(currentClassCount / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  {currentClassCount >= 10 && (
                    <span className="text-xs text-red-600 font-medium">
                      Đã đạt giới hạn
                    </span>
                  )}
                </div>
              )}
          </div>
          <div className="flex w-full md:w-auto items-center gap-3 md:gap-4">
            {/* search */}
            <div className="flex-1 md:flex-none md:w-80">
              <TableSearch />
            </div>
         
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Toggle View Mode */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Dạng lưới"
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Dạng danh sách"
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>
       
            </div>
            {role === "student" && (
               <Link href="/join">
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-200">
               + Tham gia lớp học
              </button>
            </Link>
            )}
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.length ? (
            data.map((item) => (
              <div key={item.id} className="group relative">
                <div className="relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300">
                  <Link href={`/class/${item.class_code || item.id}/newsfeed`}>
                    <div className="relative h-40 w-full overflow-hidden">
                      <Image
                        src={item.img || "/school.jpg"}
                        alt={item.name || "Class cover"}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 text-white text-sm font-medium px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                        {item._count?.students || 0} học sinh
                      </span>
                    </div>
                  </Link>

                  <div className="absolute right-2 top-2 z-10">
                    {item.deleted ? (
                      // Hiển thị badge "Đã xóa" và nút khôi phục cho lớp học đã xóa
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          Đã xóa
                        </span>
                        <ClassDeleteActions 
                          classId={item.id as number} 
                          isDeleted={true}
                        />
                      </div>
                    ) : (
                      // Menu thông thường cho lớp học chưa xóa
                      <Menu
                        menuButton={
                          <button
                            aria-label="More actions"
                            className="p-2 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white"
                          >
                            <FiMoreVertical />
                          </button>
                        }
                        transition
                      >
                        <MenuItem>
                          <Link href={`/class/${item.class_code || item.id}/newsfeed`} className="flex items-center gap-2 text-sm">
                            <FiLogIn /> Vào lớp
                          </Link>
                        </MenuItem>
                        {role === "teacher" && (
                          <MenuItem>
                            <Link href={`/class/${item.class_code || item.id}/edit`} className="flex items-center gap-2 text-sm">
                              <FiEdit /> Chỉnh sửa
                            </Link>
                          </MenuItem>
                        )}
                        {role === "teacher" && (
                          <MenuItem>
                            <div className="flex items-center gap-2 text-sm">
                              <ClassDeleteActions 
                                classId={item.id as number} 
                                isDeleted={false}
                                className=""
                              />
                            </div>
                          </MenuItem>
                        )}
                      </Menu>
                    )}
                  </div>

                  <div className="p-4">
                    <Link href={`/class/${item.class_code || item.id}/newsfeed`}>
                      <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 min-w-0 min-h-[3.5rem]" >
                        {item.name}
                      </h3>
                    </Link>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      {role === "teacher" && (
                        <div>
                          Giáo viên: <span className="font-medium">{item.supervisor?.username || "Chưa phân công"}</span>
                        </div>
                      )}
                      <div>
                        Mã lớp: <span className="font-mono">{item.class_code || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
            ) : (
              <div className="col-span-full text-center text-slate-500">Chưa có lớp nào</div>
            )}
          </div>
        ) : (
          // List View (Table)
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {data?.length ? (
              <Table columns={columns} renderRow={renderRow} data={data} />
            ) : (
              <div className="text-center py-12 text-slate-500">Chưa có lớp nào</div>
            )}
          </div>
        )}

        <div className="">
          <Pagination count={count} page={page} />
        </div>
      </div>
    </div>
  );
}
