"use client";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useState } from "react";
import { Download, FileText } from "lucide-react";

interface FileViewerProps {
  fileUrl: string;
}

function isPDF(fileUrl: string) {
  if (!fileUrl) return false;
  const decoded = decodeURIComponent(fileUrl).toLowerCase();
  return decoded.includes(".pdf");
}

function isWord(fileUrl: string) {
  if (!fileUrl) return false;
  const decoded = decodeURIComponent(fileUrl).toLowerCase();
  return decoded.includes(".doc") || decoded.includes(".docx");
}

export default function FileViewer({ fileUrl }: FileViewerProps) {
  const [loadError, setLoadError] = useState(false);

  if (!fileUrl) {
    return <p className="text-gray-500">Không có đường dẫn tài liệu.</p>;
  }

  if (isPDF(fileUrl)) {
    if (loadError) {
      return (
        <div className="w-full h-[600px] border rounded bg-gray-50 flex flex-col items-center justify-center p-6">
          <iframe
            src={fileUrl}
            className="w-full h-full border rounded"
            title="PDF Preview"
          />
        </div>
      );
    }

    return (
      <div className="p-2 h-[500px] lg:h-[700px] bg-white border rounded">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={fileUrl}
            renderError={() => (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <iframe
                  src={fileUrl}
                  className="w-full h-[550px] border rounded mb-4"
                  title="PDF Fallback Preview"
                />
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" /> Mở hoặc tải tài liệu
                </a>
              </div>
            )}
          />
        </Worker>
      </div>
    );
  }

  if (isWord(fileUrl)) {
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
      fileUrl
    )}&embedded=true`;

    return (
      <div className="w-full h-[600px] border rounded">
        <iframe
          src={viewerUrl}
          className="w-full h-full border rounded"
          allowFullScreen
          title="Word Viewer"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg border border-dashed text-center">
      <FileText className="w-12 h-12 text-gray-400 mb-3" />
      <p className="text-gray-700 font-medium mb-1">
        Xem trước trực tiếp không khả dụng cho định dạng này.
      </p>
      <p className="text-gray-500 text-sm mb-4">
        Bạn có thể tải xuống file để mở trên máy tính.
      </p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Download className="w-4 h-4" /> Tải xuống file
      </a>
    </div>
  );
}
