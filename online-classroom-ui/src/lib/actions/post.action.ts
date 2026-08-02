"use server";
import prisma from "@/lib/prisma";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";
import { z } from "zod";
import { UploadResponse } from "imagekit/dist/libs/interfaces";
import { imagekit } from "../utils";


 
// add post cho lớp học cụ thể
export const addPostToClass = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  const user = await getCurrentUser();
 
  if (!user) return { success: false, error: true, message: "Chưa đăng nhập" };
 
  const desc = formData.get("desc") as string;
  const file = formData.get("file") as File;
  const classCode = formData.get("classCode") as string;
 
  
 
  // --- (Giữ nguyên logic Upload file) ---
  let img = "";
  let imgHeight = 0;
  let video = "";
 
  if (file && file.size > 0) {
    if (!imagekit) {
      throw new Error("ImageKit is not configured.");
    }
    // (Giả sử hàm uploadFile được định nghĩa ở đây hoặc import)
    const uploadFile = async (file: File): Promise<UploadResponse> => {
       const bytes = await file.arrayBuffer();
       const buffer = Buffer.from(bytes);
       return new Promise((resolve, reject) => {
         imagekit.upload(
           { file: buffer, fileName: file.name, folder: "/posts" },
           (error, result) => {
             if (error) reject(error);
             else resolve(result as UploadResponse);
           }
         );
       });
   };
    try {
      const result: UploadResponse = await uploadFile(file);
      if (result.fileType === "image") {
        img = result.filePath;
        imgHeight = result.height || 0;
      } else {
        video = result.filePath;
      }
    } catch (error) {
      console.log("Upload error:", error);
    }
  }
 
  try {
    // 2. LẤY KẾT QUẢ BÀI POST MỚI
    const newPost = await prisma.post.create({
      data: {
        desc,
        userId: user.id as string,
        classCode,
        img,
        imgHeight,
        video,
        isSensitive: false,
      },
    });

    // === BẮT ĐẦU LOGIC GỬI THÔNG BÁO ===

    // 3. Lấy tất cả User ID trong lớp (Giáo viên + Học sinh)
    const classMembers = await prisma.class.findUnique({
      where: { class_code: classCode },
      select: {
        supervisor: { select: { userId: true } }, // User ID của Giáo viên
        students: { select: { userId: true } }    // User ID của Học sinh
      }
    });

    if (classMembers) {
      const teacherUserId = classMembers.supervisor?.userId;
      const studentUserIds = classMembers.students.map(s => s.userId).filter(Boolean) as string[];
      
      let allMemberUserIds = [...studentUserIds];
      if (teacherUserId) {
        allMemberUserIds.push(teacherUserId);
      }

      // 4. Lọc ra tất cả người nhận (Trừ người vừa post)
      const recipientUserIds = allMemberUserIds.filter(id => id !== user.id);
      
      // 5. Tạo thông báo trong DB cho tất cả người nhận
      const notificationsData = recipientUserIds.map(recipientId => ({
        recipientId: recipientId,
        actorId: user.id as string,
        type: "NEW_POST" as const, // (const để khớp với enum)
        link: `/class/${classCode}/newsfeed?postId=${newPost.id}`, // Link tới bài post
        content: "đã đăng một bài viết mới."
      }));

      if (notificationsData.length > 0) {
        await prisma.notification.createMany({
          data: notificationsData,
        });
      }

      // 6. Gửi Pusher real-time cho tất cả người nhận
      const pusherPromises = recipientUserIds.map(recipientId => {
        const channelName = `private-user-${recipientId}`;
        const eventName = "new-notification";
        const payload = {
          message: `${user.username} vừa đăng một bài mới trong lớp của bạn.`,
          link: `/class/${classCode}/newsfeed?postId=${newPost.id}`
        };
        return pusherServer.trigger(channelName, eventName, payload);
      });

      // Chạy song song
      await Promise.all(pusherPromises);
      console.log(`Pusher triggers sent to ${recipientUserIds.length} users.`);
    }
    // === KẾT THÚC LOGIC THÔNG BÁO ===
     
    revalidatePath(`/class/${classCode}/newsfeed`);
    return { success: true, error: false };

  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: "Không thể tạo bài đăng" };
  }
};

 
// like post

export const likePost = async (postId: number) => {
  const user = await getCurrentUser();

  if (!user) return { success: false, error: "Unauthorized" };
  
  const actorId = user.id as string; // <-- Người thực hiện hành động

  try {
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: actorId,
        postId: postId,
      },
    });

    if (existingLike) {
      // Unlike: xóa like
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      
      // (Không cần gửi thông báo khi "unlike")
      
      revalidatePath("/"); // (Bạn có thể giữ revalidate nếu cần)
      return { success: true, liked: false };

    } else {
      // Like: tạo like mới
      const newLike = await prisma.like.create({
        data: { 
          userId: actorId, 
          postId 
        },
        // Lấy thông tin post đã like
        include: {
          post: {
            select: {
              userId: true, // ID của chủ bài viết (người nhận)
              classCode: true,
            }
          }
        }
      });

      // === LOGIC GỬI THÔNG BÁO ===
      const recipientId = newLike.post.userId;

      // 2. Đừng tự thông báo cho chính mình
      if (recipientId !== actorId) {
        
        // 3. Tạo thông báo trong Database
        await prisma.notification.create({
          data: {
            recipientId: recipientId,
            actorId: actorId,
            type: "POST_LIKE",
            link: `/class/${newLike.post.classCode}/newsfeed?postId=${postId}`,
            content: "đã thích bài đăng của bạn."
          }
        });

        // 4. Gửi thông báo Real-time bằng Pusher
        try {
          const channelName = `private-user-${recipientId}`; 
          const eventName = "new-notification"; 
          const payload = {
            message: `${user.username} vừa thích bài đăng của bạn!`,
            link: `/class/${newLike.post.classCode}/newsfeed?postId=${postId}`,
          };

          await pusherServer.trigger(channelName, eventName, payload);
          console.log("Pusher trigger sent to:", channelName);

        } catch (error) {
          console.error("PUSHER TRIGGER ERROR:", error);
        }
      }
      // === KẾT THÚC LOGIC THÔNG BÁO ===

      //revalidatePath("/"); // (Bạn có thể giữ revalidate nếu cần)
      return { success: true, liked: true };
    }
  } catch (err) {
    console.log(err);
    return { success: false, error: "Failed to toggle like" };
  }
};


// add comment

export const addComment = async (
  prevState: { success: boolean; error: boolean; message?: string },
  formData: FormData
) => {

  const user = await getCurrentUser(); // Đây là người bình luận (Actor)
  if (!user) return { success: false, error: true, message: "Chưa đăng nhập" };

  const actorId = user.id as string;

  const postId = formData.get("postId");
  const username = formData.get("username"); // Username của chủ bài đăng (để revalidate)
  const desc = formData.get("desc");
  // Lấy classCode (Rất quan trọng cho link thông báo)
  const classCode = formData.get("classCode") as string; 

  const Comment = z.object({
    parentPostId: z.number(),
    desc: z.string().min(1, "Bình luận không thể trống").max(280),
  });

  const validatedFields = Comment.safeParse({
    parentPostId: Number(postId),
    desc,
  });

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return { success: false, error: true, message: validatedFields.error.flatten().fieldErrors.desc?.[0] };
  }

  try {
    // 2. Tìm chủ của bài đăng gốc (Người nhận)
    const parentPost = await prisma.post.findUnique({
      where: { id: validatedFields.data.parentPostId },
      select: { 
        userId: true, // ID của chủ bài viết (Người nhận)
      }
    });

    if (!parentPost) {
      return { success: false, error: true, message: "Bài đăng gốc không tồn tại." };
    }

    const recipientId = parentPost.userId;

    // 3. Dùng Transaction để tạo Comment và Notification cùng lúc
    await prisma.$transaction([
      // 3.1. Tạo bình luận (là một Post mới)
      prisma.post.create({
        data: {
          ...validatedFields.data,
          userId: actorId, // ID của người bình luận
          classCode: classCode, // Gắn bình luận vào lớp
        },
      }),

      // 3.2. Tạo thông báo (CHỈ KHI không tự bình luận bài của mình)
      ...(recipientId !== actorId ? [
        prisma.notification.create({
          data: {
            recipientId: recipientId,
            actorId: actorId,
            type: "POST_COMMENT",
            link: `/class/${classCode}/newsfeed?postId=${postId}`, // Link đến bài post GỐC
            content: "đã bình luận về bài đăng của bạn."
          }
        })
      ] : []) // Nếu tự bình luận -> không tạo thông báo
    ]);

    // 4. Gửi thông báo Real-time (CHỈ KHI không tự bình luận)
    if (recipientId !== actorId) {
      try {
        const channelName = `private-user-${recipientId}`;
        const eventName = "new-notification";
        const payload = {
          message: `${user.username} vừa bình luận về bài đăng của bạn.`,
          link: `/class/${classCode}/newsfeed?postId=${postId}`
        };
        
        await pusherServer.trigger(channelName, eventName, payload);
        console.log("Pusher trigger (comment) sent to:", channelName);

      } catch (pusherError) {
        console.error("PUSHER TRIGGER ERROR (comment):", pusherError);
        // Không làm hỏng request, chỉ log lỗi
      }
    }

    // 5. Revalidate);
    revalidatePath(`/class/${classCode}/newsfeed`); // Revalidate cả trang newsfeed
    return { success: true, error: false };

  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: "Không thể gửi bình luận." };
  }
};

// get comments for a post
export const getPostComments = async (postId: number) => {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const comments = await prisma.post.findMany({
      where: { parentPostId: postId },
      include: {
        user: { select: { username: true, img: true } },
        _count: { select: { likes: true, rePosts: true, comments: true } },
        likes: { where: { userId: user.id as string }, select: { id: true } },
        rePosts: { where: { userId: user.id as string }, select: { id: true } },
        saves: { where: { userId: user.id as string }, select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return comments;
  } catch (err) {
    console.log(err);
    return [];
  }
};

// delete post
export const deletePost = async (postId: number) => {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Tìm post để kiểm tra quyền sở hữu
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, classCode: true },
    });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    // Kiểm tra quyền xóa: chỉ người tạo post hoặc teacher của lớp mới được xóa
    let hasPermission = false;

    if (post.userId === user.id) {
      // Người tạo post
      hasPermission = true;
    } else if (user.role === "teacher" && post.classCode) {
      // Teacher của lớp có thể xóa post trong lớp của mình
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id as string },
      });
      
      if (teacher) {
        const classExists = await prisma.class.findFirst({
          where: { 
            class_code: post.classCode,
            supervisorId: teacher.id 
          },
        });
        
        if (classExists) {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      return { success: false, error: "Permission denied" };
    }

    // Sử dụng transaction để xóa tất cả dữ liệu liên quan
    await prisma.$transaction(async (prisma) => {
      // 1. Xóa tất cả likes của post này
      await prisma.like.deleteMany({
        where: { postId: postId },
      });

      // 2. Xóa tất cả saved posts
      await prisma.savedPosts.deleteMany({
        where: { postId: postId },
      });

      // 3. Xóa tất cả comments (posts con)
      await prisma.post.deleteMany({
        where: { parentPostId: postId },
      });

      // 4. Xóa tất cả reposts
      await prisma.post.deleteMany({
        where: { rePostId: postId },
      });

      // 5. Cuối cùng xóa post chính
      await prisma.post.delete({
        where: { id: postId },
      });
    });

    // Revalidate các trang liên quan
    if (post.classCode) {
      revalidatePath(`/class/${post.classCode}/newsfeed`);
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: "Failed to delete post" };
  }
};

// update post
export const updatePost = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData
) => {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: true };

  const postId = parseInt(formData.get("postId") as string);
  const desc = formData.get("desc") as string;
  const file = formData.get("file") as File;
  const removeMedia = formData.get("removeMedia") === "true";

  try {
    // Tìm post để kiểm tra quyền sở hữu
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, classCode: true, img: true, video: true },
    });

    if (!post) {
      return { success: false, error: true };
    }

    // Kiểm tra quyền sửa: chỉ người tạo post mới được sửa
    if (post.userId !== user.id) {
      return { success: false, error: true };
    }

    let updateData: any = { desc };

    // Xử lý media
    if (removeMedia) {
      // Xóa media hiện tại
      updateData.img = null;
      updateData.imgHeight = null;
      updateData.video = null;
    } else if (file && file.size > 0) {
      // Upload media mới
      if (!imagekit) {
        throw new Error("ImageKit is not configured. Please check your environment variables.");
      }

      const uploadFile = async (file: File): Promise<UploadResponse> => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        return new Promise((resolve, reject) => {
          imagekit.upload(
            {
              file: buffer,
              fileName: file.name,
              folder: "/posts",
            },
            function (error, result) {
              if (error) reject(error);
              else resolve(result as UploadResponse);
            }
          );
        });
      };

      try {
        const result: UploadResponse = await uploadFile(file);
        if (result.fileType === "image") {
          updateData.img = result.filePath;
          updateData.imgHeight = result.height || 0;
          updateData.video = null; // Clear video if uploading image
        } else {
          updateData.video = result.filePath;
          updateData.img = null; // Clear image if uploading video
          updateData.imgHeight = null;
        }
      } catch (error) {
        console.log("Upload error:", error);
        return { success: false, error: true };
      }
    }

    // Cập nhật post
    await prisma.post.update({
      where: { id: postId },
      data: updateData,
    });

    // Revalidate các trang liên quan
    if (post.classCode) {
      revalidatePath(`/class/${post.classCode}/newsfeed`);
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
