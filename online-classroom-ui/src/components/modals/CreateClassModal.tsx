"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { createPortal } from "react-dom";
import ClassForm from "@/components/forms/ClassForm";
import { classService } from "@/services/class.service";

interface CreateClassModalProps {
  onSuccess?: () => void;
}

export default function CreateClassModal({ onSuccess }: CreateClassModalProps) {
  const [open, setOpen] = useState(false);
  const [grades, setGrades] = useState<{ id: number; level: string }[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      if (grades.length === 0) {
        setLoadingGrades(true);
        classService
          .getGrades()
          .then((data) => {
            setGrades(data || []);
          })
          .catch((err) => {
            console.error("Lỗi lấy danh sách khối lớp:", err);
          })
          .finally(() => {
            setLoadingGrades(false);
          });
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, grades.length]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-sm active:scale-95"
      >
        <Plus className="h-4 w-4" />
        <span>Tạo lớp mới</span>
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm !z-[9999] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl relative w-full max-w-lg mx-auto overflow-hidden p-3 border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors z-10"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {loadingGrades ? (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2" />
                  <p className="text-sm">Đang tải dữ liệu khối lớp...</p>
                </div>
              ) : (
                <ClassForm
                  type="create"
                  setOpen={setOpen}
                  relatedData={{ grades, teachers: [] }}
                  onSuccess={onSuccess}
                />
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
