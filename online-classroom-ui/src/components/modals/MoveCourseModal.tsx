// components/modals/MoveCourseModal.tsx
"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Folder, Loader2, X } from "lucide-react";
import { FolderWithCourseCount } from "@/app/(page)/class/[id]/video/page"; // Import type
import { moveCourseToFolder } from "@/lib/actions/file.action"; // Import server action
import { toast } from "react-toastify";

interface MoveCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  currentFolderId: string | null;
  folders: FolderWithCourseCount[];
  classCode: string;
  onSuccess: () => void; // Callback để refresh
}

export default function MoveCourseModal({
  isOpen,
  onClose,
  courseId,
  currentFolderId,
  folders,
  classCode,
  onSuccess,
}: MoveCourseModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    currentFolderId || "unassigned"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await moveCourseToFolder({
        courseId,
        newFolderId: selectedFolderId,
        classCode,
      });

      if (result.success) {
        toast.success("Di chuyển khóa học thành công!");
        onSuccess(); // Gọi onSuccess (sẽ refresh và đóng modal)
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <Dialog.Title className="text-lg font-semibold text-slate-900">
            Di chuyển khóa học
          </Dialog.Title>
          <Dialog.Description className="text-sm text-slate-600">
            Chọn một thư mục mới cho khóa học này.
          </Dialog.Description>

          <form onSubmit={handleSubmit}>
            <RadioGroup.Root
              className="mt-4 space-y-2"
              value={selectedFolderId}
              onValueChange={setSelectedFolderId}
            >
              {/* Option 1: Bỏ khỏi thư mục */}
              <label className="flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <RadioGroup.Item
                  value="unassigned"
                  id="r-unassigned"
                  className="w-4 h-4 rounded-full border border-slate-400 text-blue-600 focus:ring-blue-500"
                >
                  <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-2 after:h-2 after:rounded-full after:bg-blue-600" />
                </RadioGroup.Item>
                <Folder className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-700">
                  Bỏ khỏi thư mục (Chung)
                </span>
              </label>

              {/* Option 2: Danh sách các thư mục */}
              {folders.map((folder) => (
                <label
                  key={folder.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <RadioGroup.Item
                    value={folder.id}
                    id={`r-${folder.id}`}
                    className="w-4 h-4 rounded-full border border-slate-400 text-blue-600 focus:ring-blue-500"
                  >
                    <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-2 after:h-2 after:rounded-full after:bg-blue-600" />
                  </RadioGroup.Item>
                  <Folder
                    className="w-5 h-5"
                    style={{ color: folder.color || "#64748b" }}
                  />
                  <span className="font-medium text-slate-700">
                    {folder.name}
                  </span>
                </label>
              ))}
            </RadioGroup.Root>

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  disabled={isLoading}
                >
                  Hủy
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isLoading || selectedFolderId === currentFolderId}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}