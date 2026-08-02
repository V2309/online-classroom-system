"use client";

import { useEffect, useState } from "react";
import Comments from "./Comments";

const DynamicComments = ({
  postId,
  username,
  classCode,
}: {
  postId: number;
  username: string;
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

  const refreshComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const result = await response.json();
        setComments(result);
      }
    } catch (error) {
      console.error("Error refreshing comments:", error);
    }
  };

  return (
    <Comments
      comments={comments}
      postId={postId}
      username={username}
      classCode={classCode}
      onCommentSuccess={refreshComments}
    />
  );
};

export default DynamicComments;
