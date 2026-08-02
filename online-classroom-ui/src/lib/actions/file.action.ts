"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

import slugify from "slugify";

import { z } from "zod";

 import { deleteFromS3 } from "@/lib/s3";
import {

  courseSchema as CourseValidationSchema,
  folderSchema,
 
} from "../formValidationSchema";
type CurrentState = { success: boolean; error: boolean };


 
 
 // Xóa file tài liệu
 export const deleteFile = async (fileId: string) => {
   try {
     const user = await getCurrentUser();
     
     if (!user || user.role !== "teacher") {
       throw new Error("Unauthorized: Only teachers can delete files");
     }
 
     // Kiểm tra file có tồn tại và thuộc về teacher này không
     const file = await prisma.file.findUnique({
       where: { id: fileId },
       include: {
         class: {
           select: {
             supervisorId: true,
           },
         },
       },
     });
 
     if (!file) {
       throw new Error("File not found");
     }
 
     // Lấy thông tin teacher
     const teacher = await prisma.teacher.findUnique({
       where: { userId: user.id as string },
     });
 
     if (!teacher) {
       throw new Error("Teacher not found");
     }
 
     // Kiểm tra quyền sở hữu
     if (file.class?.supervisorId !== teacher.id) {
       throw new Error("Unauthorized: You can only delete files from your own classes");
     }
 
     // Sử dụng transaction để đảm bảo tính nhất quán
     await prisma.$transaction(async (tx) => {
       // 1. Xóa file từ S3 trước
       const file_url = new URL(file.url);
       const fileKey = file_url.pathname.substring(1); // Loại bỏ dấu '/' đầu tiên
       if (!fileKey) {
         throw new Error("Invalid file URL");
       }
       
       await deleteFromS3(fileKey);
       
       // 2. Xóa khỏi database sau khi S3 thành công
       await tx.fileView.deleteMany({
         where: { fileId: fileId },
       });
       
       // 3. Xóa file record
       await tx.file.delete({
         where: { id: fileId },
       });
     });
 
     return { success: true, message: "File deleted successfully" };
   } catch (error) {
     console.error("Error deleting file:", error);
     return { 
       success: false, 
       error: error instanceof Error ? error.message : "Failed to delete file" 
     };
   }
 };
 

 
 // Tạo folder mới
 export const createFolder = async (
   currentState: CurrentState,
   formData: FormData
 ) => {
   try {
     const user = await getCurrentUser();
     if (!user || user.role !== "teacher") {
       return { success: false, error: true };
     }
 
     const teacher = await prisma.teacher.findUnique({
       where: { userId: user.id as string },
     });
 
     if (!teacher) {
       return { success: false, error: true };
     }
 
     const name = formData.get("name") as string;
     const description = formData.get("description") as string;
     const color = formData.get("color") as string;
     const classCode = formData.get("classCode") as string;
 
     // Validate dữ liệu (convert empty description to null)
     const validationResult = folderSchema.safeParse({
       name,
       description: description?.trim() || null,
       color,
       classCode,
     });
 
     if (!validationResult.success) {
       return { success: false, error: true };
     }
 
     // Kiểm tra lớp học có tồn tại và teacher có quyền truy cập không
     const classRoom = await prisma.class.findFirst({
       where: {
         class_code: classCode,
         supervisorId: teacher.id,
         deleted: false,
       },
     });
 
     if (!classRoom) {
       return { success: false, error: true };
     }
 
     // Tạo folder mới
     const folder = await prisma.folder.create({
       data: {
         name,
         description: validationResult.data.description,
         color: color || "#3B82F6", // Default blue color
         classCode,
         createdBy: teacher.id,
       },
     });
 
     return { success: true, error: false, data: folder };
   } catch (err) {
     console.log(err);
     return { success: false, error: true };
   }
 };
 


// Hàm tạo slug unique cho video
async function generateUniqueVideoSlug(title: string) {
  let baseSlug = slugify(title, {
    lower: true,
    strict: true,
  });

  let uniqueSlug = baseSlug;
  let count = 1;

  // Kiểm tra xem slug đã tồn tại trong DB chưa
  while (await prisma.video.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${count++}`; // Thêm hậu tố nếu bị trùng
  }

  return uniqueSlug;
}


 // Tạo khóa học mới với chapters và videos
 export const createCourse = async (
   currentState: CurrentState,
   formData: FormData
 ) => {
   try {
     // Xác thực người dùng
     const user = await getCurrentUser();
     if (!user || user.role !== "teacher") {
       return { success: false, error: true };
     }
 
     // Lấy teacher
     const teacher = await prisma.teacher.findUnique({
       where: { userId: user.id as string },
     });
     
     if (!teacher) {
       return { success: false, error: true };
     }
 
     // Parse dữ liệu từ form
     const data = {
       title: formData.get("title")?.toString() || "",
       description: formData.get("description")?.toString() || "",
       thumbnailUrl: "", // Sẽ tự động tạo từ video YouTube
       folderId: formData.get("folderId")?.toString() || null,
       classCode: formData.get("classCode")?.toString() || "",
       chapters: formData.get("chapters")?.toString() || "[]",
       // Thêm data cho thư mục mới
       newFolderName: formData.get("newFolderName")?.toString() || "",
       newFolderDescription: formData.get("newFolderDescription")?.toString() || "",
       newFolderColor: formData.get("newFolderColor")?.toString() || "#3B82F6",
     };
 
     // Validate dữ liệu
     const validatedFields = CourseValidationSchema.safeParse(data);
     if (!validatedFields.success) {
       return { success: false, error: true };
     }
 
     const { 
       title, 
       description, 
       thumbnailUrl, 
       folderId, 
       classCode, 
       chapters,
       newFolderName,
       newFolderDescription,
       newFolderColor
     } = validatedFields.data;
 
     // Kiểm tra lớp học
     const classRoom = await prisma.class.findFirst({
       where: {
         class_code: classCode,
         supervisorId: teacher.id,
         deleted: false,
       },
     });
 
     if (!classRoom) {
       return { success: false, error: true };
     }
 
     // Parse chapters
     let chaptersData: any[] = [];
     try {
       chaptersData = JSON.parse(chapters || "[]");
     } catch (e) {
       console.error("Error parsing chapters:", e);
     }
 
     // Tạo course và chapters trong transaction
     const result = await prisma.$transaction(async (prisma) => {
       let finalFolderId = folderId;
 
       // Kiểm tra nếu cần tạo thư mục mới
       if (!folderId && newFolderName && newFolderName.trim()) {
         // Kiểm tra xem thư mục đã tồn tại chưa
         const existingFolder = await prisma.folder.findFirst({
           where: {
             name: newFolderName.trim(),
             classCode: classCode,
             createdBy: teacher.id,
           },
         });
 
         if (existingFolder) {
           // Nếu thư mục đã tồn tại, sử dụng thư mục đó
           finalFolderId = existingFolder.id;
         } else {
           // Tạo thư mục mới
           const newFolder = await prisma.folder.create({
             data: {
               name: newFolderName.trim(),
               description: newFolderDescription?.trim() || null,
               color: newFolderColor || "#3B82F6",
               classCode: classCode,
               createdBy: teacher.id,
             },
           });
           
           finalFolderId = newFolder.id;
         }
       }
 
       // Tạo course trước (không có thumbnail)
       const course = await prisma.course.create({
         data: {
           title,
           description: description || null,
           thumbnailUrl: null, // Sẽ cập nhật sau khi có video
           folderId: finalFolderId || null,
           classCode: classCode,
           createdBy: teacher.id,
         },
       });
 
       let autoThumbnailUrl: string | null = null;
 
       // Tạo chapters và videos
       for (let chapterIndex = 0; chapterIndex < chaptersData.length; chapterIndex++) {
         const chapterData = chaptersData[chapterIndex];
         if (chapterData.title?.trim()) {
           const chapter = await prisma.chapter.create({
             data: {
               title: chapterData.title,
               description: chapterData.description || null,
               orderIndex: chapterIndex,
               courseId: course.id,
               createdBy: teacher.id,
             },
           });
 
           // Tạo videos trong chapter
           if (chapterData.videos && Array.isArray(chapterData.videos)) {
             for (let videoIndex = 0; videoIndex < chapterData.videos.length; videoIndex++) {
               const videoData = chapterData.videos[videoIndex];
               if (videoData.title?.trim() && videoData.url?.trim()) {
                 // Tạo thumbnail cho video YouTube
                 let videoThumbnailUrl: string | null = null;
                 const { extractYouTubeThumbnailFromUrl, isYouTubeUrl } = await import("@/lib/utils");
                 
                 if (isYouTubeUrl(videoData.url)) {
                   videoThumbnailUrl = extractYouTubeThumbnailFromUrl(videoData.url);
                   
                   // Sử dụng thumbnail của video đầu tiên làm thumbnail course
                   if (!autoThumbnailUrl && videoThumbnailUrl) {
                     autoThumbnailUrl = videoThumbnailUrl;
                   }
                 }
 
                 // Tạo slug unique cho video
                 const videoSlug = await generateUniqueVideoSlug(videoData.title);
 
                 await prisma.video.create({
                   data: {
                     title: videoData.title,
                     description: videoData.description || null,
                     slug: videoSlug,
                     url: videoData.url,
                     thumbnailUrl: videoThumbnailUrl, // Thêm thumbnail cho video
                     duration: videoData.duration || null,
                     orderIndex: videoIndex,
                     chapterId: chapter.id,
                     courseId: course.id,
                     createdBy: teacher.id,
                   },
                 });
               }
             }
           }
         }
       }
 
       // Cập nhật thumbnail cho course nếu có
       if (autoThumbnailUrl || thumbnailUrl) {
         await prisma.course.update({
           where: { id: course.id },
           data: { 
             thumbnailUrl: thumbnailUrl || autoThumbnailUrl 
           }
         });
       }
 
       return course;
     });
 
     revalidatePath(`/class/${classCode}/video`);
     return { success: true, error: false };
     
   } catch (err) {
     console.error("Error creating course:", err);
     return { success: false, error: true };
   }
 };
 
 // Cập nhật khóa học
 export const updateCourse = async (
   currentState: CurrentState,
   formData: FormData
 ) => {
   try {
     const user = await getCurrentUser();
     if (!user || user.role !== "teacher") {
       return { success: false, error: true };
     }
 
     const teacher = await prisma.teacher.findUnique({
       where: { userId: user.id as string },
     });
     
     if (!teacher) {
       return { success: false, error: true };
     }
 
     const data = {
       id: formData.get("courseId")?.toString() || "", // Sử dụng courseId thay vì id
       title: formData.get("title")?.toString() || "",
       description: formData.get("description")?.toString() || "",
       thumbnailUrl: formData.get("thumbnailUrl")?.toString() || "",
       folderId: formData.get("folderId")?.toString() || null,
       classCode: formData.get("classCode")?.toString() || "",
       chapters: formData.get("chapters")?.toString() || "[]",
       // Thêm data cho thư mục mới
       newFolderName: formData.get("newFolderName")?.toString() || "",
       newFolderDescription: formData.get("newFolderDescription")?.toString() || "",
       newFolderColor: formData.get("newFolderColor")?.toString() || "#3B82F6",
     };
 
     const validatedFields = CourseValidationSchema.safeParse(data);
     if (!validatedFields.success) {
       return { success: false, error: true };
     }
 
     const { 
       id, 
       title, 
       description, 
       thumbnailUrl, 
       folderId, 
       classCode, 
       chapters,
       newFolderName,
       newFolderDescription,
       newFolderColor
     } = validatedFields.data;
 
     // Kiểm tra quyền sở hữu course
     const existingCourse = await prisma.course.findFirst({
       where: {
         id: id!,
         createdBy: teacher.id,
       },
     });
 
     if (!existingCourse) {
       return { success: false, error: true };
     }
 
     // Parse chapters
     let chaptersData: any[] = [];
     try {
       chaptersData = JSON.parse(chapters || "[]");
     } catch (e) {
       console.error("Error parsing chapters:", e);
     }
 
     // Cập nhật course và chapters trong transaction
     const result = await prisma.$transaction(async (prisma) => {
       let finalFolderId = folderId;
 
       // Kiểm tra nếu cần tạo thư mục mới
       if (!folderId && newFolderName && newFolderName.trim()) {
         // Kiểm tra xem thư mục đã tồn tại chưa
         const existingFolder = await prisma.folder.findFirst({
           where: {
             name: newFolderName.trim(),
             classCode: classCode,
             createdBy: teacher.id,
           },
         });
 
         if (existingFolder) {
           // Nếu thư mục đã tồn tại, sử dụng thư mục đó
           finalFolderId = existingFolder.id;
         } else {
           // Tạo thư mục mới
           const newFolder = await prisma.folder.create({
             data: {
               name: newFolderName.trim(),
               description: newFolderDescription?.trim() || null,
               color: newFolderColor || "#3B82F6",
               classCode: classCode,
               createdBy: teacher.id,
             },
           });
           
           finalFolderId = newFolder.id;
         }
       }
 
       let autoThumbnailUrl: string | null = null;
 
       // Xóa tất cả chapters và videos cũ
       await prisma.video.deleteMany({
         where: { courseId: id! },
       });
       await prisma.chapter.deleteMany({
         where: { courseId: id! },
       });
 
       // Tạo lại chapters và videos từ dữ liệu mới
       for (let chapterIndex = 0; chapterIndex < chaptersData.length; chapterIndex++) {
         const chapterData = chaptersData[chapterIndex];
         if (chapterData.title?.trim()) {
           const chapter = await prisma.chapter.create({
             data: {
               title: chapterData.title,
               description: chapterData.description || null,
               orderIndex: chapterIndex,
               courseId: id!,
               createdBy: teacher.id,
             },
           });
 
           // Tạo videos trong chapter
           if (chapterData.videos && Array.isArray(chapterData.videos)) {
             for (let videoIndex = 0; videoIndex < chapterData.videos.length; videoIndex++) {
               const videoData = chapterData.videos[videoIndex];
               if (videoData.title?.trim() && videoData.url?.trim()) {
                 // Tạo thumbnail cho video YouTube
                 let videoThumbnailUrl: string | null = null;
                 const { extractYouTubeThumbnailFromUrl, isYouTubeUrl } = await import("@/lib/utils");
                 
                 if (isYouTubeUrl(videoData.url)) {
                   videoThumbnailUrl = extractYouTubeThumbnailFromUrl(videoData.url);
                   
                   // Sử dụng thumbnail của video đầu tiên làm thumbnail course
                   if (!autoThumbnailUrl && videoThumbnailUrl) {
                     autoThumbnailUrl = videoThumbnailUrl;
                   }
                 }
 
                 // Tạo slug unique cho video
                 const videoSlug = await generateUniqueVideoSlug(videoData.title);
 
                 await prisma.video.create({
                   data: {
                     title: videoData.title,
                     description: videoData.description || null,
                     slug: videoSlug,
                     url: videoData.url,
                     thumbnailUrl: videoThumbnailUrl,
                     duration: videoData.duration || null,
                     orderIndex: videoIndex,
                     chapterId: chapter.id,
                     courseId: id!,
                     createdBy: teacher.id,
                   },
                 });
               }
             }
           }
         }
       }
 
       // Cập nhật thông tin course
       await prisma.course.update({
         where: { id: id! },
         data: {
           title,
           description: description || null,
           thumbnailUrl: thumbnailUrl || autoThumbnailUrl || existingCourse.thumbnailUrl,
           folderId: finalFolderId || null,
         },
       });
 
       return { success: true };
     });
 
     revalidatePath(`/class/${classCode}/video`);
     return { success: true, error: false };
 
   } catch (err) {
     console.error("Error updating course:", err);
     return { success: false, error: true };
   }
 };
 
 // Xóa khóa học
 export const deleteCourse = async (
   currentState: CurrentState,
   data: FormData
 ) => {
   const id = data.get("id") as string;
   const classCode = data.get("classCode") as string;
   
   try {
     const user = await getCurrentUser();
     if (!user || user.role !== "teacher") {
       return { success: false, error: true };
     }
 
     const teacher = await prisma.teacher.findUnique({
       where: { userId: user.id as string },
     });
     
     if (!teacher) {
       return { success: false, error: true };
     }
 
     // Kiểm tra quyền sở hữu
     const course = await prisma.course.findFirst({
       where: {
         id: id,
         createdBy: teacher.id,
       },
     });
 
     if (!course) {
       return { success: false, error: true };
     }
 
     // Xóa course sẽ cascade xóa chapters và videos
     await prisma.course.delete({
       where: { id: id },
     });
 
     revalidatePath(`/class/${classCode}/video`);
     return { success: true, error: false };
 
   } catch (err) {
     console.error("Error deleting course:", err);
     return { success: false, error: true };
   }
 };
 
 // Xóa thư mục
 export const deleteFolder = async (
   currentState: CurrentState,
   data: FormData
 ) => {
   const id = data.get("id") as string;
   const classCode = data.get("classCode") as string;
   
   try {
     const user = await getCurrentUser();
     if (!user || user.role !== "teacher") {
       return { success: false, error: true };
     }
 
     const teacher = await prisma.teacher.findUnique({
       where: { userId: user.id as string },
     });
     
     if (!teacher) {
       return { success: false, error: true };
     }
 
     // Kiểm tra quyền sở hữu folder
     const folder = await prisma.folder.findFirst({
       where: {
         id: id,
         createdBy: teacher.id,
       },
       include: {
         _count: {
           select: { courses: true },
         },
       },
     });
 
     if (!folder) {
       return { success: false, error: true };
     }
 
     // Sử dụng transaction để đảm bảo data consistency
     await prisma.$transaction(async (prisma) => {
       // Di chuyển tất cả courses trong folder về "Tất cả" (folderId = null)
       await prisma.course.updateMany({
         where: { folderId: id },
         data: { folderId: null },
       });
 
       // Sau đó xóa folder
       await prisma.folder.delete({
         where: { id: id },
       });
     });
 
     revalidatePath(`/class/${classCode}/video`);
     return { 
       success: true, 
       error: false, 
       message: `Đã xóa thư mục "${folder.name}". Các khóa học trong thư mục này đã được chuyển về "Tất cả".`
     };
 
   } catch (err) {
     console.error("Error deleting folder:", err);
     return { success: false, error: true };
   }
 };
 
 export const updateFolder = async (
   data: z.infer<typeof folderSchema> & { id: string }
 ) => {
   try {
     const { id, ...updateData } = data;
 
     // Convert empty description to null
     if (updateData.description !== undefined && updateData.description?.trim() === '') {
       updateData.description = null;
     }
 
     // Kiểm tra folder có tồn tại không
     const existingFolder = await prisma.folder.findUnique({
       where: { id },
     });
 
     if (!existingFolder) {
       return { success: false, error: true, message: "Không tìm thấy thư mục." };
     }
 
     // Cập nhật folder
     await prisma.folder.update({
       where: { id },
       data: updateData,
     });
 
 
     return { success: true, message: "Đã cập nhật thư mục thành công!" };
   } catch (error) {
     console.error("Error updating folder:", error);
     return { success: false, error: true, message: "Có lỗi xảy ra khi cập nhật thư mục." };
   }
 };
 
 // moveCourseToFolder

 interface MoveCourseParams {
  courseId: string;
  newFolderId: string | null;
  classCode: string; // Cần classCode để revalidate đúng path
}

export async function moveCourseToFolder(params: MoveCourseParams) {
  const { courseId, newFolderId, classCode } = params;

  try {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        // Nếu newFolderId là 'unassigned' thì set là null
        // Nếu không, gán newFolderId
        folderId: newFolderId === "unassigned" ? null : newFolderId,
      },
    });

    // Revalidate lại trang video của lớp học
    revalidatePath(`/class/${classCode}/video`);

    return { success: true };
  } catch (error) {
    console.error("Error moving course:", error);
    return { success: false, error: "Không thể di chuyển khóa học." };
  }
}