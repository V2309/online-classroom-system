
"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Breadcrumb from "@/components/Breadcrumb";
export default function SelectHomeworkTypePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const classId = params.id;

  return (
    
    <div className=" w-full mx-auto h-full ">
      <div className="flex flex-col items-center h-full "> 
        <div className="w-full bg-white p-4 rounded-lg flex  items-center ">
        <Breadcrumb
          items={[
            { label: "Bài tập", href: `/class/${params.id}/homework/list` },
          //  { label: "Tạo bài tập", href: `/teacher/class/${params.id}/homework/add` },
            { label: "Chọn dạng đề", active: true }
          ]}
        />
      </div>
     
      <div className=" bg-white mt-4 h-full p-4">
      <h2 className="text-2xl font-bold mb-8 text-center mt-4 ">Tạo bài tập</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {/* Giữ nguyên định dạng */}
        <div
          className="border-2 border-blue-500  bg-white rounded-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push(`/class/${classId}/homework/add/original`)}
        >
          <Image src="/note.gif" alt="Giữ nguyên định dạng" width={70} height={70} />
          <h3 className="font-bold text-lg mt-4 mb-2">Trắc nghiệm - Giữ nguyên</h3>
          <p className="text-center text-gray-500 mb-4 text-sm">Đề bài được giữ nguyên và hiển thị khi làm bài</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm">Chọn</button>
        </div>
        {/* Tách câu tự động */}
        <div
          className="border-2 border-blue-500 bg-white rounded-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push(`/class/${classId}/homework/add/auto`)}
        >
          <Image src="/note2.gif" alt="Tách câu tự động" width={70} height={60} />
          <h3 className="font-bold text-lg mt-4 mb-2">Trắc nghiệm - Tự động</h3>
          <p className="text-center text-gray-500 mb-4 text-sm">Nhận diện đề trắc nghiệm từ file Word, PDF</p>
          <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded mb-2">Mới</span>
          <button className="bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm">Tải File</button>
        </div>
        {/* Tự luận */}
        <div
          className="border-2 border-green-500 bg-white rounded-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push(`/class/${classId}/homework/add/essay`)}
        >
          <div className="w-[70px] h-[70px] bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h3v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45.5a2.5 2.5 0 10-3.9 0 .5.5 0 00.95.5 1.5 1.5 0 001 0 .5.5 0 00.95-.5z" clipRule="evenodd"/>
            </svg>
          </div>
          <h3 className="font-bold text-lg mt-4 mb-2">Tự luận</h3>
          <p className="text-center text-gray-500 mb-4 text-sm">Tạo câu hỏi tự luận bằng AI từ file hoặc chủ đề</p>
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded mb-2">AI</span>
          <button className="bg-green-500 text-white px-4 py-2 rounded font-bold text-sm">Tạo tự luận</button>
        </div>
      </div>
      </div>
    </div>
    </div>
  );
}