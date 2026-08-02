"use client";

import React from "react";

interface DocxViewerProps {
  fileUrl: string;
}

function isWord(fileUrl: string) {
  const lowerUrl = fileUrl.toLowerCase();
  return lowerUrl.endsWith(".doc") || lowerUrl.endsWith(".docx");
}

export default function DocxViewer({ fileUrl }: DocxViewerProps) {
  if (!isWord(fileUrl)) {
    return <p className="text-red-500">File không phải định dạng Word (.doc/.docx)</p>;
  }

  const encodedUrl = encodeURIComponent(fileUrl);

  return (
    <div className=" p-2 h-[400px] lg:h-[600px] bg-white">
      <iframe
        title="Google Docs Viewer"
        src={`https://docs.google.com/gview?url=${encodedUrl}&embedded=true`}
        width="100%"
        height="100%"
        style={{ border: "none" }}
        className="w-full h-full"
      ></iframe>
    </div>
  );
}
