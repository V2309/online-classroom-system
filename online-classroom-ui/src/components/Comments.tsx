"use client";

import { useUser } from "@/hooks/useUser";
// import Image from "./Image";
import Post from "./Post";
import { Post as PostType } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { addComment } from "@/lib/actions/post.action";
import Image from "next/image";

type CommentWithDetails = PostType & {
  user: { displayName: string | null; username: string; img: string | null };
  _count: { likes: number; rePosts: number; comments: number };
  likes: { id: number }[];
  rePosts: { id: number }[];
  saves: { id: number }[];
};

const Comments = ({
  comments,
  postId,
  username,
  classCode,
  onCommentSuccess,
}: {
  comments: CommentWithDetails[];
  postId: number;
  username: string;
  classCode?: string;
  onCommentSuccess?: () => void;
}) => {
  const { user, loading } = useUser();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useFormState(addComment, {
    success: false,
    error: false,
  });

  // Không dùng optimistic update nữa, chỉ dùng loading state
  const [submitting, setSubmitting] = useState(false);

  // Wrap formAction để handle loading state
  const optimisticFormAction = (formData: FormData) => {
    if (!user) return;
    
    setSubmitting(true);
    
    // Clear form
    if (formRef.current) {
      formRef.current.reset();
    }
    
    // Submit form thật
    formAction(formData);
  };



  // Component để hiển thị trạng thái submit
  function SubmitButton() {
    const { pending } = useFormStatus();
    
    return (
      <button
        disabled={pending || submitting}
        className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {(pending || submitting) ? "..." : "Bình luận"}
      </button>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
    
      
      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id}>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={comment.user.img ? `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${comment.user.img}` : "/avatar.png"}
                    alt="User Avatar main"
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block">
                    <div className="font-semibold text-sm">{comment.user.username}</div>
                    <div className="text-sm text-gray-800">{comment.desc}</div>
                  </div>
                  <div className="flex items-center gap-4 mt-1 ml-3 text-xs text-gray-500">
                    <button className="hover:underline">Like</button>
                    <button className="hover:underline">Reply</button>
                    <span>{new Date(comment.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

            {/* Comment input form */}
      {user && !loading && (
        <div className="mb-3">
          <form ref={formRef} action={optimisticFormAction} className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={user?.img ? `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${user.img}` : "/avatar.png"}
                alt="User Avatar cmt"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <input type="number" name="postId" hidden readOnly value={postId} />
            <input type="string" name="username" hidden readOnly value={username} />
            {classCode && (
              <input type="string" name="classCode" hidden readOnly value={classCode} />
            )}
            <div className="flex-1 flex items-center gap-2 ml-3">
              <input
                type="text"
                name="desc"
                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hãy nói gì đó..."
              />
              <SubmitButton />
            </div>
          </form>
          {state.error && (
            <div className="mt-2 text-red-500 text-sm">Something went wrong!</div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
};

export default Comments;