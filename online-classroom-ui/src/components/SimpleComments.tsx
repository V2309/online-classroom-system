"use client";

import { useUser } from "@/hooks/useUser";
import Image from "next/image";
import { useState } from "react";

interface Comment {
  id: number;
  desc: string;
  createdAt: Date;
  user: {
    username: string;
    img: string | null;
  };
}

const SimpleComments = ({
  comments,
  onAddComment,
}: {
  comments: Comment[];
  onAddComment: (commentText: string) => void;
}) => {
  const { user, loading } = useUser();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || submitting) return;

    setSubmitting(true);
    onAddComment(commentText.trim());
    setCommentText("");
    setSubmitting(false);
  };

  return (
    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={comment.user.img ? `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${comment.user.img}` : "/avatar.png"}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-gray-100 rounded-2xl px-2.5 sm:px-3 py-1.5 sm:py-2 inline-block max-w-full">
                  <div className="font-semibold text-xs sm:text-sm truncate">{comment.user.username}</div>
                  <div className="text-xs sm:text-sm text-gray-800 break-words">{comment.desc}</div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 mt-1 ml-2 sm:ml-3 text-xs text-gray-500">
                  <button className="hover:underline">Like</button>
                  <button className="hover:underline">Reply</button>
                  <span className="hidden sm:inline">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                  <span className="sm:hidden">{new Date(comment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input form */}
      {user && !loading && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={user?.img ? `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${user.img}` : "/avatar.png"}
              alt="User Avatar cmt1"
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1 sm:ml-3 relative">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-gray-100 border-0 rounded-full pl-3 sm:pl-4 pr-16 sm:pr-20 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Hãy nói gì đó..."
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {submitting ? "..." : "Bình luận"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SimpleComments;
