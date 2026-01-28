---
title: Route Action Gen
---

Route Action Gen is a tool that generates the code for

- [Next.js Route Handlers (App Router)](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js API Routes (Pages Router)](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [React Server Functions](https://react.dev/reference/rsc/server-functions)
- [React Form Actions](https://react.dev/reference/react/useActionState)

## Usage

```package-install
npm install route-action-gen
```

## Quick Start

1. Create a `route.[method].config.ts` file in the directory where you want to generate the code. For example, if you want to create a POST route handler for the `/api/posts/[postId]/` endpoint in Next.js App Router, create a `route.post.config.ts` file in the `app/api/posts/[postId]/` directory.
2. Fill up the config file with the following:

```ts title="app/api/posts/[postId]/route.post.config.ts" lineNumbers
import { z } from "zod";
import {
  AuthFunc,
  createRequestValidator,
  successResponse,
  errorResponse,
  HandlerFunc,
} from "route-action-gen/lib";
import { getUser, User } from "../user";
import { getPost, updatePost } from "../post";

// The body validator
const bodyValidator = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

// The dyanamic params validator
const paramsValidator = z.object({
  postId: z.string().min(1),
});

// The auth function to authorize the request
const auth: AuthFunc<User> = async () => {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
};

// The request validator which combines all the validators
export const requestValidator = createRequestValidator({
  body: bodyValidator,
  params: paramsValidator,
  user: auth,
});

// The response validator to validate the response
export const responseValidator = z.object({
  id: z.string().min(1),
});

// The handler function to handle the request
export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  const { body, params, user } = data;
  const post = await getPost(params.postId);
  if (!post) {
    return errorResponse("Post not found", undefined, 404);
  }
  if (post.userId !== user.id) {
    return errorResponse(
      "User does not have permission to update this post",
      undefined,
      403
    );
  }

  await updatePost(params.postId, {
    title: body.title,
    content: body.content,
  });

  return successResponse({ id: post.id });
};
```

3. Run the `route-action-gen` command to generate the code.

```bash
npx route-action-gen
```

This will generate the following files:

- `app/api/posts/[postId]/.generated/client.ts`
- `app/api/posts/[postId]/.generated/form-components.ts`
- `app/api/posts/[postId]/.generated/form.action.ts`
- `app/api/posts/[postId]/.generated/route.ts`
- `app/api/posts/[postId]/.generated/server.function.ts`
- `app/api/posts/[postId]/.generated/use-form-action.tsx`
- `app/api/posts/[postId]/.generated/use-server-function.tsx`
- `app/api/posts/[postId]/.generated/use-route-post.tsx`
- `app/api/posts/[postId]/.generated/use-server-function.tsx

4. Create the Next.js Route handler file by importing the generated files:

```ts title="app/api/posts/[postId]/route.ts" lineNumbers
export * from "./.generated/route";
```

5. You can use `fetch` from the client component to call the route handler, or you can use the generated `use-route-post.tsx` hook to call the route handler from a React client component.

```tsx title="app/posts/page.tsx" lineNumbers
"use client";

import { useRoutePost } from "../../api/posts/[postId]/.generated/use-route-post";

export default function WithHookPage() {
  const {
    data: postResult,
    error: postError,
    isLoading: postIsLoading,
    fetchData: fetchPost,
  } = useRoutePost();
searchParams: {} });
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
    </div>
  );
}
```

## Why use this tool?

There are many ways to get and update data in a server. You can update data via a server function or a route handler. But essentially, you want to execute a function in the server and get the response back in the client.
