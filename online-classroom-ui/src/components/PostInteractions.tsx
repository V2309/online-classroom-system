"use client";

import { useUser } from "@/hooks/useUser";
import { useOptimistic, useState, useEffect, useCallback } from "react";
import SimpleComments from "./SimpleComments";
import { postService } from "@/services/post.service";
import { ThumbsUp, MessageSquare, Share2 } from "lucide-react";
import { toast } from "react-toastify";

const PostInteractions = ({
  username,
  postId,
  count,
  isLiked,
  classCode,
}: {
  username: string;
  postId: number;
  count: { likes: number; comments: number };
  isLiked: boolean;
  classCode?: string;
}) => {
  const [state, setState] = useState({
    likes: count.likes,
    isLiked: isLiked,
    comments: count.comments,
  });
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const comments = await postService.getComments(postId);
      setCommentsList(comments);
      setCommentsLoaded(true);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }, [postId]);

  useEffect(() => {
    if (showComments && !commentsLoaded) {
      fetchComments();
    }
  }, [showComments, commentsLoaded, fetchComments]);

  const { user } = useUser();

  const likeAction = async () => {
    if (!user) return;

    addOptimisticCount("like");

    try {
      const res = await postService.toggleLike(postId);
      setState((prev) => ({
        ...prev,
        likes: res.likesCount,
        isLiked: res.isLiked,
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Bài viết từ ${username}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết bài viết!");
    }
  };

  const addComment = useCallback(
    async (postId: number, commentText: string) => {
      try {
        await postService.addComment(postId, { desc: commentText });
        await fetchComments();
      } catch (error) {
        console.error("Failed to add comment:", error);
      }
    },
    [fetchComments]
  );

  const addCommentOptimistic = useCallback(
    (commentText: string) => {
      if (!user) return;
      const newComment = {
        id: Date.now(),
        desc: commentText,
        createdAt: new Date(),
        user: {
          username: user.username,
          img: user.img || null,
        },
      };
      setCommentsList((prev) => [...prev, newComment]);
      setState((prev) => ({
        ...prev,
        comments: prev.comments + 1,
      }));
      addComment(postId, commentText);
    },
    [user, postId, addComment]
  );

  const [optimisticCount, addOptimisticCount] = useOptimistic(
    state,
    (prev, type: "like") => {
      if (type === "like") {
        return {
          ...prev,
          likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
          isLiked: !prev.isLiked,
        };
      }
      return prev;
    }
  );

  return (
    <div className="pt-3 mt-3 border-t border-border/70">
      {/* INTERACTION BUTTONS */}
      <div className="flex items-center justify-between gap-4 text-secondary select-none">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* LIKE BUTTON */}
          <button
            type="button"
            onClick={likeAction}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              optimisticCount.isLiked
                ? "bg-accent text-primary"
                : "hover:bg-muted text-secondary hover:text-foreground"
            }`}
          >
            <ThumbsUp
              className={`w-4 h-4 transition-transform active:scale-125 ${
                optimisticCount.isLiked ? "fill-primary text-primary" : ""
              }`}
            />
            <span>{optimisticCount.likes} Thích</span>
          </button>

          {/* COMMENTS BUTTON */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              showComments
                ? "bg-accent text-primary"
                : "hover:bg-muted text-secondary hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{state.comments} Bình luận</span>
          </button>
        </div>

        {/* SHARE BUTTON */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-muted text-secondary hover:text-foreground transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Chia sẻ</span>
        </button>
      </div>

      {/* COMMENTS SECTION */}
      {showComments && (
        <SimpleComments
          comments={commentsList}
          onAddComment={addCommentOptimistic}
        />
      )}
    </div>
  );
};

export default PostInteractions;
