"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

interface Grade {
  id: number;
  level: string;
}

interface GradeSelectionProps {
  grades: Grade[];
  currentGradeId: number;
  currentGradeLevel: string;
  onGradeSelect?: (gradeId?: number, newGradeLevel?: string) => void;
}

export default function GradeSelection({
  grades,
  currentGradeId,
  currentGradeLevel,
  onGradeSelect,
}: GradeSelectionProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [showNewGradeInput, setShowNewGradeInput] = useState(false);
  const [newGradeValue, setNewGradeValue] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (currentGradeId && currentGradeId > 0) {
      setSelectedGrade(currentGradeId.toString());
    }
  }, [currentGradeId]);

  const handleGradeChange = (gradeId: string) => {
    setSelectedGrade(gradeId);
    if (gradeId === "other") {
      setShowNewGradeInput(true);
      onGradeSelect?.(undefined, newGradeValue);
      if (typeof window !== "undefined") {
        setTimeout(() => {
          const input = document.getElementById("newGradeInput") as HTMLInputElement;
          if (input) {
            input.focus();
          }
        }, 100);
      }
    } else {
      setShowNewGradeInput(false);
      setNewGradeValue("");
      onGradeSelect?.(Number(gradeId), undefined);
    }
  };

  const handleNewGradeInputChange = (val: string) => {
    setNewGradeValue(val);
    onGradeSelect?.(undefined, val);
  };

  if (!isClient) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-bold text-foreground">Khối lớp</label>
        <p className="text-xs text-muted-foreground">
          Khối hiện tại: <span className="font-bold text-primary">{currentGradeLevel}</span>
        </p>
        <div className="flex flex-wrap gap-2.5">
          {grades.map((g) => (
            <span
              key={g.id}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted text-foreground"
            >
              {g.level}
            </span>
          ))}
          <span className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-primary">
            + Khác
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        type="hidden"
        name="gradeId"
        value={selectedGrade === "other" ? "" : selectedGrade}
      />
      <input
        type="hidden"
        name="newGradeLevel"
        value={selectedGrade === "other" ? newGradeValue : ""}
      />

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-bold text-foreground mb-1">Khối lớp</label>
          <p className="text-xs text-muted-foreground">
            Khối hiện tại: <span className="font-bold text-primary">{currentGradeLevel}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5" suppressHydrationWarning>
          {grades.map((g) => {
            const isSelected = selectedGrade === g.id.toString();
            return (
              <label key={g.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="gradeSelection"
                  value={g.id}
                  checked={isSelected}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="hidden peer"
                />
                <span
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold select-none transition-all inline-block ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs scale-105"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {g.level}
                </span>
              </label>
            );
          })}

          {/* Nút Khác */}
          <label className="cursor-pointer">
            <input
              type="radio"
              name="gradeSelection"
              value="other"
              checked={selectedGrade === "other"}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="hidden peer"
            />
            <span
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold select-none transition-all inline-flex items-center gap-1 ${
                selectedGrade === "other"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs scale-105"
                  : "bg-accent text-primary hover:bg-accent/80"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Khác</span>
            </span>
          </label>
        </div>

        {/* Ô input hiện ra khi chọn "Khác" */}
        {showNewGradeInput && (
          <div className="mt-3 p-4 bg-accent/40 border border-primary/20 rounded-2xl space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
            <label htmlFor="newGradeInput" className="block text-xs font-bold text-primary">
              Nhập tên khối mới:
            </label>
            <input
              type="text"
              id="newGradeInput"
              value={newGradeValue}
              onChange={(e) => handleNewGradeInputChange(e.target.value)}
              className="w-full bg-white text-foreground border border-border rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none"
              placeholder="Ví dụ: Khối 11, Lớp chuyên Toán..."
              autoComplete="off"
            />
            <p className="text-[11px] text-muted-foreground">
              💡 Khối mới sẽ được lưu tự động khi bạn bấm Lưu thay đổi.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
