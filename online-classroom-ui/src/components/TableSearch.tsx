"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
const TableSearch = () => {
  const router = useRouter();
  const handleSubmit  = (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();
    
    const value = (e.currentTarget[0] as HTMLFormElement).value;
    const params = new URLSearchParams(window.location.search);
    params.set("search", value); // You can replace this with actual search term
    router.push(`${window.location.pathname}?${params}`);
  }
    return (
    <form onSubmit={handleSubmit} className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder="Tìm kiếm..."
        className="w-[200px] p-2 bg-transparent outline-none"
      />
    </form>
  );
};

export default TableSearch;
