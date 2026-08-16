
"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Breadcrumb from "@/components/Breadcrumb";
export default function SelectHomeworkTypePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const classId = params.id;

  return (
    
    <div className="w-full mx-auto h-full bg-background text-foreground p-4">
      <div className="flex flex-col items-center h-full"> 
        <div className="w-full bg-card p-4 rounded-xl border border-border flex items-center shadow-sm">
          <Breadcrumb
            items={[
              { label: "Bài tập", href: `/class/${params.id}/homework/list` },
              { label: "Chọn dạng đề", active: true }
            ]}
          />
        </div>
     
        <div className="bg-card border border-border rounded-xl shadow-sm mt-4 w-full max-w-5xl p-6 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-8 text-center mt-2 text-foreground">Tạo bài tập</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Giữ nguyên định dạng */}
            <div
              className="border-2 border-primary/40 bg-background rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-primary hover:bg-accent/30 hover:shadow-lg transition-all duration-200"
              onClick={() => router.push(`/class/${classId}/homework/add/original`)}
            >
              <Image src="/note.gif" alt="Giữ nguyên định dạng" width={70} height={70} />
              <h3 className="font-bold text-lg mt-4 mb-2 text-foreground">Trắc nghiệm - Giữ nguyên</h3>
              <p className="text-center text-muted-foreground mb-4 text-sm">Đề bài được giữ nguyên và hiển thị khi làm bài</p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary-hover transition-colors">Chọn</button>
            </div>
            {/* Tách câu tự động */}
            <div
              className="border-2 border-primary/40 bg-background rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-primary hover:bg-accent/30 hover:shadow-lg transition-all duration-200"
              onClick={() => router.push(`/class/${classId}/homework/add/auto`)}
            >
              <Image src="/note2.gif" alt="Tách câu tự động" width={70} height={60} />
              <h3 className="font-bold text-lg mt-4 mb-2 text-foreground">Trắc nghiệm - Tự động</h3>
              <p className="text-center text-muted-foreground mb-4 text-sm">Nhận diện đề trắc nghiệm từ file Word, PDF</p>
              <span className="bg-terra-amber text-white text-xs px-2 py-0.5 rounded-full mb-2">Mới</span>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary-hover transition-colors">Tải File</button>
            </div>
            {/* Tự luận */}
            <div
              className="border-2 border-state-success/40 bg-background rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-state-success hover:bg-accent/30 hover:shadow-lg transition-all duration-200"
              onClick={() => router.push(`/class/${classId}/homework/add/essay`)}
            >
              <div className="w-[70px] h-[70px] bg-state-success/15 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-state-success" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h3v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45.5a2.5 2.5 0 10-3.9 0 .5.5 0 00.95.5 1.5 1.5 0 001 0 .5.5 0 00.95-.5z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg mt-4 mb-2 text-foreground">Tự luận</h3>
              <p className="text-center text-muted-foreground mb-4 text-sm">Tạo câu hỏi tự luận bằng AI từ file hoặc chủ đề</p>
              <span className="bg-destructive text-white text-xs px-2 py-0.5 rounded-full mb-2">AI</span>
              <button className="bg-state-success text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-state-success/90 transition-colors">Tạo tự luận</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}