"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface TableSearchProps {
  placeholder?: string;
  className?: string;
}

const TableSearch = ({
  placeholder = "Tìm kiếm...",
  className = "",
}: TableSearchProps) => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("search") as HTMLInputElement;
    const value = input?.value?.trim() ?? "";
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset về trang 1 khi search
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full flex items-center gap-2.5 text-xs sm:text-sm rounded-full border border-border bg-card px-3.5 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all ${className}`}
    >
      <Image
        src="/search.png"
        alt="Search"
        width={15}
        height={15}
        className="opacity-60 flex-shrink-0"
      />
      <input
        name="search"
        type="text"
        placeholder={placeholder}
        defaultValue={
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("search") || ""
            : ""
        }
        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-xs sm:text-sm"
      />
    </form>
  );
};

export default TableSearch;
