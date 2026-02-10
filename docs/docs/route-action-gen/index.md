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
      403,
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

There are many ways to get and update data in a server. You can update data via a server function or a route handler. But essentially, you want to execute a function in the server and get the response back in the client. This tool allows you to focus on the main logic of the function and let the tool handle the boilerplate code for you.

## How it works

When the `route-action-gen` command is run, it will search for all of the config files (`route.[get|post|put|delete|patch|options|head].config.ts` files) in the current directory and its subdirectories. Then it will generate the files in the `.generated` directory in the same directory as the config file. For example, if there are `route.get.config.ts` and `route.post.config.ts` in the `app/api/posts/[postId]/` directory, the `route-action-gen` will generate the following files:

- `app/api/posts/[postId]/.generated/client.ts`
- `app/api/posts/[postId]/.generated/form-components.ts`
- `app/api/posts/[postId]/.generated/form.action.ts`
- `app/api/posts/[postId]/.generated/route.ts`
- `app/api/posts/[postId]/.generated/server.function.ts`
- `app/api/posts/[postId]/.generated/use-form-action.tsx`
- `app/api/posts/[postId]/.generated/use-server-function.tsx`
- `app/api/posts/[postId]/.generated/use-route-post.tsx`

## The command

The `route-action-gen` command has the following options:

- `--help`: Show the help message.
- `--version`: Show the version number.
- `--framework <framework>`: The framework to generate the code for. Currently supported frameworks are:

- `next-app-router`: Generate the code for Next.js App Router. This is the default framework.
- `next-api-routes`: Generate the code for Next.js API Routes. (Planned)
- `hono`: Generate the code for Hono. (Planned)

## The config file

The config file needs to export the following:

- `requestValidator`: The request validator object.
- `responseValidator`: The response validator object.
- `handler`: The handler function.

## The request validator

The request validator is an object that contains the following properties:

- `body`: The body validator.
- `params`: The params validator.
- `headers`: The headers validator.
- `searchParams`: The search params validator.
- `user`: The user validator.

### Body validator

The body validator is a zod object that defines the body schema for the request.

### Params validator

The params validator is a zod object that defines the params schema for the request.

### Headers validator

The headers validator is a zod object that defines the headers schema for the request.

### Search params validator

The search params validator is a zod object that defines the search params schema for the request.

### User validator

The user validator is a function that returns the user object for the request. You can use this to authorize the request. The rules are:

- If the request is authenticated, return the user object.
- If the request is not authenticated but you want to allow it to continue, return null.
- If you want to reject the request, throw an error. Returning null means the end point accepts both authenticated and unauthenticated requests.

## The response validator

The response validator is a zod object that defines the response schema for a successful response. This validator is required to make sure the `handler` function is strongly typed.

## The handler function

The handler function is the main function that will be executed when a request is made to the route. It will be called with an object that contains the validated body (if any), params (if any), headers (if any), search params (if any), and user (if any). The existence of the properties in the object depends on the schema of the request validator.

The handler function must return either a `successResponse` or `errorResponse` object by calling either the `successResponse` or `errorResponse` function.
