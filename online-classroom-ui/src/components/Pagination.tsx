"use client";
import { ITEM_PER_PAGE } from "@/lib/setting";
import { useRouter } from "next/navigation";
const Pagination = ({ page, count } : { page: number; count: number }) => {
  const router = useRouter();

  const hasPrev =  ITEM_PER_PAGE * (page - 1) > 0;
  const hasNext = ITEM_PER_PAGE * ( page - 1 ) + ITEM_PER_PAGE < count;

 const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };
  return (
      <div className="flex items-center justify-between text=gray-500 mt-4">
         <button 
         disabled={!hasPrev}
         onClick={() => changePage(page - 1)} className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 
         disabled:cursor-not-allowed">
              Prev
         </button>
            <div className="flex items-center gap-2 text-sm">
              {Array.from({ length: Math.ceil(count / ITEM_PER_PAGE) }, (_, i) => (
                <button key={i} className={`px-2 rounded-sm ${i + 1 === page ? "bg-lamaSky" : ""}`} onClick={() => changePage(i + 1)}>
                  {i + 1}
                </button>
                ))}
            </div>
              <button 
              disabled={!hasNext}
              onClick={() => changePage(page + 1)} className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                 Next
              </button>
        </div>
    );
}
export default Pagination;