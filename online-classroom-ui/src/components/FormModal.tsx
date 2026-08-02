// /src/components/FormModal.tsx

"use client";

import { deleteClass } from "@/lib/actions/class.action";

import { deleteCourse, deleteFolder } from "@/lib/actions/file.action";

import { removeStudentFromClass, deleteHomework } from "@/lib/actions/actions";

import dynamic from "next/dynamic";

import Image from "next/image";

import { useRouter } from "next/navigation";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { useFormState } from "react-dom";

import { toast } from "react-toastify";

import { FormContainerProps } from "./FormContainer";

const deleteActionMap = {
  class: deleteClass,

  course: deleteCourse,

  folder: deleteFolder,

  studentFromClass: removeStudentFromClass,

  homework: deleteHomework,

  // TODO: OTHER DELETE ACTIONS
};

const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Loading...</h1>,
});

// const FolderForm = dynamic(() => import("./forms/FolderForm"), {

//   loading: () => <h1>Loading...</h1>,

// });

// TODO: OTHER FORMS

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,

    type: "create" | "update",

    data?: any,

    relatedData?: any
  ) => JSX.Element;
} = {
  class: (setOpen, type, data, relatedData) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),

  // folder: (setOpen, type, data, relatedData) => (

  //   <FolderForm

  //     type={type}

  //     data={data}

  //     setOpen={setOpen}

  //     onSuccess={() => {

  //       // Refresh trang sau khi thành công

  //       window.location.reload();

  //     }}

  //   />

  // ),

  // TODO OTHER LIST ITEMS
};

const FormModal = ({
  table,

  type,

  data,

  id,

  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";

  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-lamaPurple";

  const [open, setOpen] = useState(false);

  const Form = () => {
    const deleteAction = (
      deleteActionMap as Record<string, typeof deleteClass>
    )[table];

    const [state, formAction] = useFormState(deleteAction, {
      success: false,

      error: false,
    });

    const router = useRouter();

    useEffect(() => {
      console.log("FormModal state:", state); // Debug log

      if (state.success) {
        const messages = {
          course: "Khóa học đã được xóa thành công!",

          class: "Lớp học đã được xóa thành công!",

          subject: "Môn học đã được xóa thành công!",

          folder: "Thư mục đã được xóa thành công!",

          studentFromClass: "Học sinh đã được loại bỏ khỏi lớp học thành công!",

          homework: "Bài tập đã được xóa thành công!",
        };

        const message =
          messages[table as keyof typeof messages] ||
          `${table} đã được xóa nha !`;

        console.log("Showing toast:", message); // Debug log

        toast.success(message);

        setOpen(false);

        // Delay refresh để toast có thời gian hiển thị

        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else if (state.error) {
        console.log("Error occurred:", state); // Debug log

        // Hiển thị message cụ thể nếu có, không thì dùng message mặc định

        const errorMessage =
          (state as any).message || "Có lỗi xảy ra khi xóa. Vui lòng thử lại!";

        toast.error(errorMessage);
      }
    }, [state, router]);

    return type === "delete" && id ? (
      <form action={formAction} className="p-6 flex flex-col gap-6">
        <input type="text | number" name="id" value={id} readOnly hidden />

        {/* Thêm classCode nếu table là course, folder hoặc studentFromClass */}

        {(table === "course" || table === "folder") && data?.classCode && (
          <input
            type="text"
            name="classCode"
            value={data.classCode}
            readOnly
            hidden
          />
        )}

        {table === "studentFromClass" && relatedData?.classCode && (
          <input
            type="text"
            name="classCode"
            value={relatedData.classCode}
            readOnly
            hidden
          />
        )}

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {table === "studentFromClass"
              ? "Xác nhận loại bỏ học sinh"
              : `Xác nhận xóa ${
                  table === "course"
                    ? "khóa học"
                    : table === "folder"
                    ? "thư mục"
                    : table === "homework"
                    ? "bài tập"
                    : table
                }`}
          </h3>

          <p className="text-sm text-gray-500">
            {table === "studentFromClass"
              ? "Học sinh sẽ bị loại bỏ khỏi lớp học này. Bạn có chắc chắn muốn tiếp tục?"
              : table === "folder"
              ? 'Thư mục sẽ bị xóa và không thể khôi phục. Các khóa học trong thư mục này sẽ được chuyển về "Tất cả".'
              : "Tất cả dữ liệu sẽ bị mất và không thể khôi phục."}{" "}
            {table !== "studentFromClass" &&
              `Bạn có chắc chắn muốn xóa ${
                table === "course"
                  ? "khóa học"
                  : table === "folder"
                  ? "thư mục"
                  : table === "homework"
                  ? "bài tập"
                  : table
              } này không?`}
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Hủy
          </button>

          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {table === "studentFromClass" ? "Loại bỏ" : "Xóa"}
          </button>
        </div>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table](setOpen, type, data, relatedData)
    ) : (
      "Form not found!"
    );
  };

  return (
    <>
      {type === "delete" ? (
        // Special styling for delete button in dropdown

        <button
          className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
          onClick={() => setOpen(true)}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>

          <span>Xóa</span>
        </button>
      ) : type === "update" && table === "folder" ? (
        // Special styling for folder update button in dropdown

        <button
          className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
          onClick={() => setOpen(true)}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            />
          </svg>

          <span>Đổi tên</span>
        </button>
      ) : (
        // Original button for create/update (non-folder)

        <button
          className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
          onClick={() => setOpen(true)}
        >
          <Image src={`/${type}.png`} alt="" width={16} height={16} />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 !z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl relative w-full max-w-md mx-auto">
            <Form />

            <div
              className="absolute top-4 right-4 cursor-pointer hover:bg-gray-100 rounded-full p-1 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
