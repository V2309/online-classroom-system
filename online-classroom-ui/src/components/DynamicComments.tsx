"use client";

import { useEffect, useState } from "react";
import SimpleComments from "./SimpleComments";

const DynamicComments = ({
  postId,
}: {
  postId: number;
  username?: string;
  classCode?: string;
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        if (response.ok) {
          const result = await response.json();
          setComments(result);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
      setLoading(false);
    };

    fetchComments();
  }, [postId]);

  if (loading) {
    return (
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-center text-gray-500 text-sm py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          Loading comments...
        </div>
      </div>
    );
  }

  const handleAddComment = async (commentText: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desc: commentText }),
      });
      if (response.ok) {
        const newComment = await response.json();
        setComments((prev) => [...prev, newComment]);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <SimpleComments
      comments={comments}
      onAddComment={handleAddComment}
      postId={postId}
    />
  );
};

export default DynamicComments;
