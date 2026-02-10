# route-action-gen

A code generation CLI that produces type-safe route handlers, client classes, React hooks, server functions, form actions, and form components from declarative route config files. Eliminates boilerplate by turning a single config into a full set of ready-to-use artifacts for your Next.js App Router project.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Usage](#cli-usage)
- [Config File Format](#config-file-format)
- [Generated Files](#generated-files)
- [Library Exports](#library-exports)
- [Examples](#examples)
- [Project Structure](#project-structure)

## Installation

```bash
npm install route-action-gen
```

The package exposes a CLI binary at `route-action-gen` and several library entry points used by the generated code at runtime.

## Quick Start

**1. Create a route config file** in your Next.js App Router route directory:

```
app/api/posts/[postId]/route.post.config.ts
```

```typescript
import { z } from "zod";
import {
  createRequestValidator,
  type AuthFunc,
  type HandlerFunc,
  successResponse,
} from "route-action-gen/lib";

const auth: AuthFunc<{ id: string }> = async () => {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
};

export const requestValidator = createRequestValidator({
  body: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
  }),
  params: z.object({ postId: z.string().min(1) }),
  user: auth,
});

export const responseValidator = z.object({
  id: z.string().min(1),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  const { body, params, user } = data;
  // Your business logic here
  return successResponse({ id: "1" });
};
```

**2. Run the CLI:**

```bash
npx route-action-gen
```

**3. Use the generated code:**

Generated files appear in `app/api/posts/[postId]/.generated/` and are ready to import.

## CLI Usage

```
route-action-gen v0.0.0

Generate route handlers, server functions, form actions, and React hooks
from route config files.

Usage:
  npx route-action-gen [options]

Options:
  -h, --help                Show help message
  -v, --version             Show version number
  -f, --framework <name>    Framework target (default: next-app-router)
```

### How It Works

1. **Scan** - Recursively finds all `route.[method].config.ts` files in the current directory
2. **Group** - Groups config files by their parent directory (multiple methods per directory are supported)
3. **Parse** - Extracts metadata from each config file (validators, fields, auth presence)
4. **Generate** - Produces framework-specific files using templates
5. **Write** - Outputs generated files to a `.generated/` subdirectory alongside the config files

### Example Output

```
route-action-gen v0.0.0
Framework: next-app-router
Scanning for config files in: /Users/you/my-app

Generated in /Users/you/my-app/app/api/posts/[postId]/.generated/:
  - route.ts
  - client.ts
  - use-route-post.tsx
  - server.function.ts
  - form.action.ts
  - use-server-function.tsx
  - use-form-action.tsx
  - form-components.tsx

Done! Generated 8 file(s) in 1 directory(ies).
```

### Supported Frameworks

| Framework          | Flag Value        | Description                                                                      |
| ------------------ | ----------------- | -------------------------------------------------------------------------------- |
| Next.js App Router | `next-app-router` | Default. Generates for Next.js App Router (route handlers, server actions, etc.) |

The framework system is extensible. New frameworks can be added by implementing the `FrameworkGenerator` interface.

## Config File Format

### File Naming

Config files follow the naming convention:

```
route.[method].config.ts
```

Where `[method]` is one of: `get`, `post`, `put`, `delete`, `patch`, `options`, `head`.

You can have **multiple config files in the same directory** (e.g., `route.get.config.ts` and `route.post.config.ts`) and they will be combined into a single `route.ts` and `client.ts`.

### Required Exports

Every config file must export three things:

| Export              | Type                                 | Description                                  |
| ------------------- | ------------------------------------ | -------------------------------------------- |
| `requestValidator`  | `ReturnType<createRequestValidator>` | Describes the shape of incoming request data |
| `responseValidator` | `z.ZodType`                          | Zod schema for the response body             |
| `handler`           | `HandlerFunc`                        | Async function that processes the request    |

### Request Validator Options

The `createRequestValidator` function accepts an object with these optional fields:

| Field          | Type          | Description                                                |
| -------------- | ------------- | ---------------------------------------------------------- |
| `body`         | `z.ZodType`   | Zod schema for the request body (typically POST/PUT/PATCH) |
| `params`       | `z.ZodType`   | Zod schema for route parameters (e.g., `[postId]`)         |
| `headers`      | `z.ZodType`   | Zod schema for request headers                             |
| `searchParams` | `z.ZodType`   | Zod schema for URL query parameters                        |
| `user`         | `AuthFunc<T>` | Async auth function that returns a user object or throws   |

### Handler Function

The handler receives a fully typed data object derived from your validators:

```typescript
export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  // Properties available based on your requestValidator:
  const { body, params, headers, user, searchParams } = data;

  // Return a success response
  return successResponse({ id: "1" });

  // Or return an error response
  return errorResponse("Not found", undefined, 404);
};
```

### Auth Function

The `AuthFunc` type defines how authentication is handled:

```typescript
type AuthFunc<TUser> = (request?: Request) => Promise<TUser>;
```

- **Return a user object** if authenticated
- **Return `null`** to allow unauthenticated requests to continue
- **Throw an error** to reject the request

## Generated Files

The files generated depend on the HTTP method. All files are output to a `.generated/` subdirectory.

### Files Generated for All Methods

| File                     | Description                                                                 |
| ------------------------ | --------------------------------------------------------------------------- |
| `route.ts`               | Next.js route handler. Exports named functions like `GET`, `POST`, etc.     |
| `client.ts`              | `RouteClient` class with typed methods for each HTTP method (non-React use) |
| `use-route-[method].tsx` | React hook for the HTTP method                                              |

### Additional Files for Body Methods (POST, PUT, PATCH)

| File                      | Description                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| `server.function.ts`      | Next.js server action wrapping the handler (`"use server"`)      |
| `form.action.ts`          | Next.js form action wrapping the handler (`"use server"`)        |
| `use-server-function.tsx` | React hook for calling the server function with `useTransition`  |
| `use-form-action.tsx`     | React hook for form actions using `useActionState`               |
| `form-components.tsx`     | Auto-generated form input/label components from your Zod schemas |

### route.ts

Exports named route handlers consumed by Next.js App Router:

```typescript
import { createRoute } from "route-action-gen/lib/next";
import {
  handler as postHandler,
  requestValidator as postRequestValidator,
  responseValidator as postResponseValidator,
} from "../route.post.config";

export const POST = createRoute(
  postRequestValidator,
  postResponseValidator,
  postHandler,
);
```

### client.ts

A `RouteClient` class with typed methods for each HTTP method. Useful outside of React (scripts, tests, non-React frontends):

```typescript
import { RouteClient } from "./.generated/client";

const client = new RouteClient();

// Fully typed - params, body, and response are all inferred from your Zod schemas
const result = await client.post({
  body: { title: "Hello", content: "World" },
  params: { postId: "123" },
});
```

### use-route-get.tsx

A React hook for GET requests that auto-fetches on mount and when dependencies change:

```typescript
import { useRouteGet } from "./.generated/use-route-get";

function PostPage({ postId }: { postId: string }) {
  const { data, error, isLoading, cancel, refetch, lastFetchedAt } =
    useRouteGet({
      params: { postId },
    });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <h1>{data?.title}</h1>;
}
```

**Returned properties:**

| Property        | Type                | Description                         |
| --------------- | ------------------- | ----------------------------------- |
| `data`          | `z.infer<response>` | The validated response data         |
| `error`         | `string \| null`    | Error message if the request failed |
| `isLoading`     | `boolean`           | Whether a request is in flight      |
| `cancel`        | `() => void`        | Abort the current request           |
| `refetch`       | `() => void`        | Trigger a new fetch                 |
| `lastFetchedAt` | `number \| null`    | Timestamp of the last fetch         |

### use-route-[post/put/patch/delete].tsx

React hooks for mutation methods. Unlike GET hooks, these do not auto-fetch -- you call `fetchData` imperatively:

```typescript
import { useRoutePost } from "./.generated/use-route-post";

function CreatePostForm({ postId }: { postId: string }) {
  const { data, error, isLoading, fetchData } = useRoutePost();

  const handleSubmit = () => {
    fetchData({
      params: { postId },
      body: { title: "Hello", content: "World" },
      options: { timeoutMs: 15_000 }, // optional, defaults to 10s
    });
  };

  return <button onClick={handleSubmit}>Create</button>;
}
```

**Returned properties:**

| Property    | Type                 | Description                        |
| ----------- | -------------------- | ---------------------------------- |
| `data`      | `z.infer<response>`  | The validated response data        |
| `error`     | `Error \| null`      | Error object if the request failed |
| `isLoading` | `boolean`            | Whether a request is in flight     |
| `fetchData` | `(input) => Promise` | Function to trigger the request    |

### server.function.ts

A `"use server"` module exporting a server function that can be called directly from client components:

```typescript
import { serverFunction } from "./.generated/server.function";

// Call from a client component or another server action
const result = await serverFunction({
  body: { title: "Hello", content: "World" },
  params: { postId: "123" },
});
```

### use-server-function.tsx

A React hook wrapping the server function with `useTransition` for non-blocking UI updates:

```typescript
import { useServerFunction } from "./.generated/use-server-function";

function MyComponent() {
  const { data, error, pending, fetchData } = useServerFunction();

  return (
    <button
      disabled={pending}
      onClick={() =>
        fetchData({
          body: { title: "Hello", content: "World" },
          params: { postId: "123" },
        })
      }
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}
```

### use-form-action.tsx

A React hook wrapping `useActionState` for progressive-enhancement-friendly forms:

```typescript
import { useFormAction } from "./.generated/use-form-action";

function MyForm() {
  const { FormWithAction, state, pending } = useFormAction();

  return (
    <FormWithAction>
      <input name="body.title" />
      <input name="body.content" />
      <input name="params.postId" type="hidden" value="123" />
      <button type="submit" disabled={pending}>
        Submit
      </button>
    </FormWithAction>
  );
}
```

**Returned properties:**

| Property         | Type              | Description                                    |
| ---------------- | ----------------- | ---------------------------------------------- |
| `FormWithAction` | `React.Component` | A `<form>` component pre-bound with the action |
| `state`          | `ActionResult`    | The result returned by the form action         |
| `pending`        | `boolean`         | Whether the form submission is in progress     |

### form-components.tsx

Auto-generated input and label components keyed by field name. Zod types are mapped to HTML input types automatically (e.g., `z.number()` becomes `type="number"`, `z.boolean()` becomes `type="checkbox"`):

```typescript
import { formComponents } from "./.generated/form-components";
import { useFormAction } from "./.generated/use-form-action";

function MyForm() {
  const { FormWithAction, state, pending } = useFormAction();
  const TitleInput = formComponents["body.title"].input;
  const TitleLabel = formComponents["body.title"].label;

  return (
    <FormWithAction>
      <TitleLabel />
      <TitleInput className="border rounded px-2 py-1" />
      <button type="submit">Submit</button>
    </FormWithAction>
  );
}
```

Field names follow the pattern `body.<fieldName>` for body fields and `params.<fieldName>` for param fields. Labels are automatically derived from field names (e.g., `postId` becomes "Post Id").

## Library Exports

The package provides several runtime entry points used by generated code:

| Entry Point                  | Description                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `route-action-gen/lib`       | Core utilities: `createRequestValidator`, `successResponse`, `errorResponse`, `HandlerFunc`, `AuthFunc`, `mapZodError` |
| `route-action-gen/lib/next`  | Next.js helpers: `createRoute`, `createServerFunction`, `createFormAction`                                             |
| `route-action-gen/lib/react` | React helpers: `createInput`, `createLabel`, `createFormWithAction`                                                    |
| `route-action-gen/lib/node`  | Node.js helpers for server-side usage                                                                                  |

## Examples

### GET with Route Params

```
app/api/posts/[postId]/route.get.config.ts
```

```typescript
import { z } from "zod";
import {
  createRequestValidator,
  type HandlerFunc,
  successResponse,
} from "route-action-gen/lib";

export const requestValidator = createRequestValidator({
  params: z.object({ postId: z.string().min(1) }),
});

export const responseValidator = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  const post = await db.posts.findById(data.params.postId);
  return successResponse(post);
};
```

**Generates:** `route.ts`, `client.ts`, `use-route-get.tsx`

---

### DELETE with Route Params

```
app/api/posts/[postId]/route.delete.config.ts
```

```typescript
import { z } from "zod";
import {
  createRequestValidator,
  type HandlerFunc,
  successResponse,
} from "route-action-gen/lib";

export const requestValidator = createRequestValidator({
  params: z.object({ postId: z.string().min(1) }),
});

export const responseValidator = z.object({
  success: z.boolean(),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  await db.posts.delete(data.params.postId);
  return successResponse({ success: true });
};
```

**Generates:** `route.ts`, `client.ts`, `use-route-delete.tsx`

---

### POST with Body, Params, and Auth

```
app/api/posts/[postId]/route.post.config.ts
```

```typescript
import { z } from "zod";
import {
  createRequestValidator,
  type AuthFunc,
  type HandlerFunc,
  successResponse,
  errorResponse,
} from "route-action-gen/lib";

const auth: AuthFunc<{ id: string }> = async () => {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
};

export const requestValidator = createRequestValidator({
  body: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
  }),
  params: z.object({ postId: z.string().min(1) }),
  user: auth,
});

export const responseValidator = z.object({
  id: z.string().min(1),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  const { body, params, user } = data;
  const post = await db.posts.update(params.postId, body, user.id);
  return successResponse({ id: post.id });
};
```

**Generates:** `route.ts`, `client.ts`, `use-route-post.tsx`, `server.function.ts`, `form.action.ts`, `use-server-function.tsx`, `use-form-action.tsx`, `form-components.tsx`

---

### Combined GET + POST in Same Directory

Place both `route.get.config.ts` and `route.post.config.ts` in the same directory. The generator combines them into a single `route.ts` with both `GET` and `POST` exports, and a single `client.ts` with both `get()` and `post()` methods. Method-specific files (hooks, server functions, etc.) are generated separately for each method.

## Project Structure

A typical project using `route-action-gen` looks like this:

```
app/
  api/
    posts/
      [postId]/
        route.get.config.ts        # Your config (you write this)
        route.post.config.ts       # Your config (you write this)
        .generated/                # Auto-generated (do not edit)
          route.ts                 #   Next.js route handler
          client.ts                #   RouteClient class
          use-route-get.tsx        #   GET hook
          use-route-post.tsx       #   POST hook
          server.function.ts       #   Server function
          form.action.ts           #   Form action
          use-server-function.tsx   #   Server function hook
          use-form-action.tsx       #   Form action hook
          form-components.tsx       #   Form components
```

Consider adding `.generated/` to your `.gitignore` and running `route-action-gen` as part of your build pipeline, or keep them checked in for editor autocompletion -- the choice is yours.

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build
```
