import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import PostListItem from "./PostListItem";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";

const fetchPosts = async (
  pageParam,
  searchParams,
  getToken,
  isLoaded,
  isSignedIn
) => {
  if (!isLoaded || !isSignedIn) {
    console.warn(
      "Clerk not fully loaded or user not signed in. Skipping API call."
    );
    throw new Error("Authentication required.");
  }

  const token = await getToken({ template: "backend" });
  if (!token) {
    console.error("JWT token not found after login.");
    throw new Error("Authentication token missing.");
  }

  const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page: pageParam,
      limit: 2,
      ...Object.fromEntries(searchParams.entries()),
    },
  });

  return res.data;
};

const PostList = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ メインの useQuery（元の構造を保持）
  const {
    isPending,
    error: queryError,
    data,
  } = useQuery({
    queryKey: ["repoData"],
    queryFn: async () => {
      if (!isLoaded || !isSignedIn) {
        console.warn(
          "Clerk not fully loaded or user not signed in. Skipping API call."
        );
        throw new Error("Authentication required.");
      }

      const token = await getToken({ template: "backend" });
      if (!token) {
        console.error("JWT token not found after login.");
        throw new Error("Authentication token missing.");
      }

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    enabled: isLoaded && isSignedIn,
  });

  // ✅ useInfiniteQuery の追加（今後の無限スクロール等に使用可能）
  const {
    data: infiniteData,
    error: infiniteError,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["posts", searchParams.toString()],
    queryFn: ({ pageParam = 1 }) =>
      fetchPosts(pageParam, searchParams, getToken, isLoaded, isSignedIn),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
    enabled: isLoaded && isSignedIn,
  });

  // 状態チェック（元のロジックを優先）
  if (!isLoaded) return "Loading authentication...";
  if (!isSignedIn) return "Please sign in to view posts.";
  if (isPending) return "Loading posts...";
  if (queryError) {
    console.error("Error fetching posts:", queryError);
    return "An error has occurred: " + queryError.message;
  }

  const allPosts =
    infiniteData?.pages?.flatMap((page) => page?.posts ?? []) || [];

  // ログ出力は元のまま
  console.log("normal data:", data);
  console.log("infinite data:", infiniteData);

  return (
    <InfiniteScroll
      dataLength={allPosts.length}
      next={fetchNextPage}
      hasMore={!!hasNextPage}
      loader={<h4>Loading more posts...</h4>}
      endMessage={
        <p>
          <b>All posts loaded!</b>
        </p>
      }
    >
      {/* ⭐ UIはそのまま、PostListItemを静的に羅列 */}
      {allPosts.map((post) => (
        <PostListItem key={post._id} post={post} />
      ))}
    </InfiniteScroll>
  );
};

export default PostList;
