"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import Post from "./Post";
import { useEffect, useMemo } from "react";

const fetchPosts = async (pageParam: number, userProfileId?: string, classCode?: string) => {
  const params = new URLSearchParams({
    cursor: pageParam.toString(),
  });
  
  if (userProfileId) params.append("user", userProfileId);
  if (classCode) params.append("classCode", classCode);
  
  const res = await fetch(`/api/posts?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }
  return res.json();
};

const InfiniteFeed = ({ userProfileId, classCode }: { userProfileId?: string, classCode?: string }) => {
  const { data, error, status, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["posts", userProfileId, classCode],
    queryFn: ({ pageParam = 2 }) => fetchPosts(pageParam, userProfileId, classCode),
    initialPageParam: 2, // Bắt đầu từ page 2 vì page 1 đã được server render
    getNextPageParam: (lastPage, pages) => {
      // Nếu không có data hoặc không hasMore thì dừng
      if (!lastPage.hasMore || !lastPage.posts || lastPage.posts.length === 0) {
        return undefined;
      }
      // Trả về page tiếp theo (bắt đầu từ page 3, 4, 5...)
      return pages.length + 2;
    },
  });

  // Manual scroll detection for debugging - PHẢI ĐẶT TRƯỚC CONDITIONAL RETURNS
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const scrollPercentage = (scrollTop + windowHeight) / documentHeight;
      
    
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, fetchNextPage]);



  // Deduplicate posts để tránh duplicate keys
  const allPosts = useMemo(() => {
    const posts = data?.pages?.flatMap((page) => page.posts) || [];
    const uniquePosts = [];
    const seenIds = new Set();
    
    for (const post of posts) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        uniquePosts.push(post);
      }
    }
    
    return uniquePosts;
  }, [data]);
  


  if (error) return (
    <div className="text-center py-6 sm:py-8 text-red-500">
      <div className="text-sm sm:text-base">❌ Có lỗi xảy ra khi tải bài viết!</div>
    </div>
  );
  
  if (status === "pending") return (
    <div className="flex justify-center items-center py-6 sm:py-8">
      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-500 text-sm sm:text-base">Đang tải bài viết...</span>
    </div>
  );

  // Nếu không có posts nào từ infinite scroll thì không render gì
  // (vì posts đầu tiên đã được server-side render)
  if (allPosts.length === 0 && !hasNextPage) {
    return null;
  }

  return (
    <div>
      
      <InfiniteScroll
        dataLength={allPosts.length}
        next={() => {
          fetchNextPage();
        }}
        hasMore={!!hasNextPage}
        loader={
          <div className="flex justify-center items-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500 text-sm sm:text-base">Đang tải thêm bài viết...</span>
          </div>
        }
        endMessage={
          <div className="text-center py-6 sm:py-8">
            <p className="text-gray-500 text-sm sm:text-base">Bạn đã xem hết tất cả bài viết!</p>
          </div>
        }
        scrollThreshold={0.8}
        scrollableTarget="class-content-scroll"
      >
        {allPosts.map((post) => (
          <div key={post.id} className="mb-3 sm:mb-4">
            <Post post={post} />
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default InfiniteFeed;