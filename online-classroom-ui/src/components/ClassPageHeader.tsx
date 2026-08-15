import React from "react";

interface ClassPageHeaderProps {
  title: string;
  count?: number | string;
  children?: React.ReactNode;
  className?: string;
}

export default function ClassPageHeader({
  title,
  count,
  children,
  className = "",
}: ClassPageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 py-4 border-b border-gray-400 bg-white ${className}`}
    >
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <span>{title}</span>
        {count !== undefined && count !== null && (
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
            {count}
          </span>
        )}
      </h1>
      {children && (
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          {children}
        </div>
      )}
    </div>
  );
}
