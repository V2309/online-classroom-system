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
      className={`bg-white/90 backdrop-blur-md border-b border-border/80 px-5 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-foreground transition-all ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground flex items-center gap-2.5 tracking-tight">
          <span>{title}</span>
        </h1>
        {count !== undefined && count !== null && (
          <span className="text-xs font-bold text-primary bg-accent px-3 py-1 rounded-full shadow-2xs">
            {count}
          </span>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2.5 mt-2 sm:mt-0 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
