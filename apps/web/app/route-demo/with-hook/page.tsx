"use client";

import { useRoutePost } from "../../api/posts/[postId]/.generated/use-route-post";
import { useRouteGet } from "../../api/posts/[postId]/.generated/use-route-get";

export default function WithHookPage() {
  const {
    data: postResult,
    error: postError,
    isLoading: postIsLoading,
    fetchData: fetchPost,
  } = useRoutePost();
  const {
    data: getResult,
    error: getError,
    isLoading: getIsLoading,
    refetch: refetchGet,
    lastFetchedAt: getLastFetchedAt,
  } = useRouteGet({ params: { postId: "1" } });
  return (
    <div>
      <h1>This is a page with hooks</h1>
      <div>
        <h2>Post Result</h2>
        {postIsLoading && <div>Posting...</div>}
        <pre>{JSON.stringify(postResult, null, 2)}</pre>
        {postError && <div>{postError.message}</div>}
        <button
          onClick={() =>
            fetchPost({
              body: { title: "Hello, world!", content: "Hello, world!" },
              params: { postId: "1" },
            })
          }
        >
          Post
        </button>
      </div>
      <div>
        <h2>Get Result</h2>
        {getIsLoading && <div>Getting...</div>}
        <pre>{JSON.stringify(getResult, null, 2)}</pre>
        {getError && <div>{getError}</div>}
        <button onClick={() => refetchGet()}>Refetch</button>
        <div>Last Fetched At: {getLastFetchedAt ?? "Not fetched yet"}</div>
      </div>
    </div>
  );
}
