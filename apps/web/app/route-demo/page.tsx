"use client";

import { Button } from "@workspace/ui/components/button";
import { RouteClient } from "../api/posts/[postId]/.generated/client";

export default function RouteDemoPage() {
  return (
    <div>
      <h1>Route Demo Page</h1>
      <Button
        variant="outline"
        onClick={async () => {
          const routeClient = new RouteClient();
          const result = await routeClient.post({
            body: {
              title: "Hello, world!",
              content: "Hello, world!",
            },
            params: {
              postId: "1",
            },
          });
          console.log(result);

          const getResult = await routeClient.get({
            params: {
              postId: "1",
            },
          });
          console.log(getResult);
        }}
      >
        Post
      </Button>
    </div>
  );
}
