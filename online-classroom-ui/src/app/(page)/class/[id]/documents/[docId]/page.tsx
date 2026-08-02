

import prisma from '@/lib/prisma';
import { getCurrentUser } from "@/lib/auth";
import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import PDFViewer from '@/components/PDFViewer';

export default async function DocumentDetail({ 
  params 
}: { 
  params: { id: string; docId: string } 
}) {
  // Lấy thông tin user hiện tại
  const user = await getCurrentUser();

  // Lấy thông tin file từ database
  const file = await prisma.file.findUnique({
    where: { id: params.docId },
    include: {
      teacher: {
        select: {
          username: true,
        },
      },
      class: {
        select: {
          name: true,
          class_code: true,
        },
      },
    },
  });

  if (!file) {
    notFound();
  }

  // Tạo record FileView để đánh dấu user đã xem file này (chỉ tạo lần đầu tiên)
  if (user) {
    try {
      await prisma.fileView.upsert({
        where: {
          fileId_userId: {
            fileId: params.docId,
            userId: user.id as string,
          },
        },
        update: {
          // Không cập nhật gì cả - giữ nguyên thời gian xem lần đầu tiên
        },
        create: {
          fileId: params.docId,
          userId: user.id as string,
          viewedAt: new Date(), // Chỉ set thời gian khi tạo mới (lần đầu tiên)
        },
      });
    } catch (error) {
      // Log error nhưng không block việc hiển thị tài liệu
      console.error("Error creating file view record:", error);
    }
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/class/${params.id}/documents`}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{file.name}</h1>
                <p className="text-sm text-gray-500">
                  {file.class?.name && `Lớp: ${file.class.name}`}
                </p>
              </div>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2  text-black rounded-md hover:bg-gray-200  border border-gray-300 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Tải xuống
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
     
          {/* Main content - File viewer */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Xem trước tài liệu</h3>
              <PDFViewer fileUrl={file.url} />
            </div>
          </div>
      </div>
    </div>
  );
}