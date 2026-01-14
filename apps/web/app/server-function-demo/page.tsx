"use client";

import { Button } from "@workspace/ui/components/button";
import { useServerFunction } from "../api/posts/[postId]/.generated/use-server-function";

export default function ServerFunctionDemoPage() {
  const { fetchData, pending, error, data } = useServerFunction();
  return (
    <div>
      <h1>Server Function Demo</h1>
      {pending && <div>Pending...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>Post ID: {data.id}</div>}
      <Button
        disabled={pending}
        onClick={() => {
          fetchData({
            body: {
              title: "Hello, world!",
              content: "Hello, world!",
            },
            params: {
              postId: "1",
            },
          });
        }}
      >
        Fetch Data
      </Button>
    </div>
  );
}
