"use client";

import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

interface FileViewerProps {
  fileUrl: string;
}

function isPDF(fileUrl: string) {
  return fileUrl.toLowerCase().endsWith(".pdf");
}

function isWord(fileUrl: string) {
  return fileUrl.toLowerCase().endsWith(".doc") || fileUrl.toLowerCase().endsWith(".docx");
}

export default function FileViewer({ fileUrl }: FileViewerProps) {
  if (isPDF(fileUrl)) {
    return (
      <div className=" p-2 h-[400px] lg:h-[600px] bg-white">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer fileUrl={fileUrl} />
        </Worker>
      </div>
    );
  }

  if (isWord(fileUrl)) {
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
      fileUrl
    )}&embedded=true`;

    return (
      <iframe
        src={viewerUrl}
        className="w-full h-[600px] border rounded"
        allowFullScreen
        title="Word Viewer"
      />
    );
  }

  return <p className="text-red-500">Không hỗ trợ định dạng file này.</p>;
}
