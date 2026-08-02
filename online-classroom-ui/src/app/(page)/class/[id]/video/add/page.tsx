import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CourseForm from "@/components/forms/CourseForm";
import prisma from "@/lib/prisma";

export default async function AddVideoPage({ 
    params 
}: { 
    params: { id: string } 
}) {
    // Kiểm tra quyền truy cập
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
        redirect("/");
    }

    // Lấy thông tin teacher
    const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id as string },
    });
    
    if (!teacher) {
        redirect("/");
    }

    const classCode = params.id;

    // Kiểm tra lớp học có tồn tại và teacher có quyền truy cập không
    const classRoom = await prisma.class.findFirst({
        where: {
            class_code: classCode,
            supervisorId: teacher.id,
            deleted: false,
        },
    });

    if (!classRoom) {
        redirect("/teacher/class");
    }

    // Lấy danh sách folders để chọn
    const folders = await prisma.folder.findMany({
        where: {
            classCode: classCode,
            createdBy: teacher.id,
        },
        orderBy: {
            createdAt: 'asc',
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Tạo khóa học mới
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Tạo khóa học cho lớp {classRoom.name}
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border">
                    <CourseForm 
                        classCode={classCode}
                        folders={folders}
                    />
                </div>
            </div>
        </div>
    );
}