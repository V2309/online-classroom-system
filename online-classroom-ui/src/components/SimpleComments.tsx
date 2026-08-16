"use client";

import { useUser } from "@/hooks/useUser";
import Image from "@/components/Image";
import { useState } from "react";
import { Send } from "lucide-react";

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
  postId?: number;
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
    <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-border mt-0.5">
                <Image
                  path={comment.user.img || "/avatar.png"}
                  alt={comment.user.username || "User Avatar"}
                  w={32}
                  h={32}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-card rounded-2xl px-3.5 py-2 inline-block max-w-full border border-border/60 shadow-2xs">
                  <div className="font-bold text-xs text-foreground truncate">
                    {comment.user.username}
                  </div>
                  <div className="text-xs text-foreground break-words mt-0.5 leading-relaxed">
                    {comment.desc}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-muted-foreground font-medium">
                  <button type="button" className="hover:underline hover:text-primary cursor-pointer">
                    Thích
                  </button>
                  <button type="button" className="hover:underline hover:text-primary cursor-pointer">
                    Trả lời
                  </button>
                  <span>
                    {new Date(comment.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input form */}
      {user && !loading && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-border">
            <Image
              path={user?.img || "/avatar.png"}
              alt="User Avatar"
              w={32}
              h={32}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-card text-foreground placeholder:text-muted-foreground border border-border/80 rounded-full pl-4 pr-12 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
              placeholder="Viết bình luận của bạn..."
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="absolute right-1.5 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer active:scale-95"
              title="Gửi bình luận"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SimpleComments;
