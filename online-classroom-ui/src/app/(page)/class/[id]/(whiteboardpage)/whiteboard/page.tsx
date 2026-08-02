"use client";

import { useState, useCallback } from 'react';
import { ArrowLeft, Save, Trash2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CollaborativeWhiteboard from "@/components/CollaborativeWhiteboard";

import {getCurrentUser} from "@/lib/auth";

export default function WhiteboardPage({params}: {params: {id: string}}) {

  const router = useRouter();
  const [whiteboardMethods, setWhiteboardMethods] = useState<{
    save: () => Promise<void>;
    clear: () => Promise<void>;
    isSaving: boolean;
  } | null>(null);

  const handleSave = useCallback(async () => {
    if (whiteboardMethods?.save) {
      await whiteboardMethods.save();
    }
  }, [whiteboardMethods]);

  const handleClear = useCallback(async () => {
    if (whiteboardMethods?.clear) {
      await whiteboardMethods.clear();
    }
  }, [whiteboardMethods]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-white flex flex-col">
      {/* Header toolbar */}
      <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Quay lại</span>
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold text-gray-900">Bảng trắng</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!whiteboardMethods?.save || whiteboardMethods.isSaving}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Lưu"
          >
            <Save size={16} />
            <span className="text-sm">{whiteboardMethods?.isSaving ? "Đang lưu..." : "Lưu"}</span>
          </button>
          
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Tải xuống"
          >
            <Download size={16} />
            <span className="text-sm">Tải xuống</span>
          </button>
          
          <button
            onClick={handleClear}
            disabled={!whiteboardMethods?.clear}
            className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Xóa tất cả"
          >
            <Trash2 size={16} />
            <span className="text-sm">Xóa</span>
          </button>
        </div>
      </div>
      
      {/* Whiteboard content area */}
      <div className="flex-1 w-full overflow-hidden">
        <CollaborativeWhiteboard 
          classCode={params.id}
          onReady={setWhiteboardMethods}
        />
      </div>
    </div>
  );
}
