# route-action-gen

A code generation CLI that produces type-safe route handlers, client classes, React hooks, server functions, form actions, and form components from declarative route config files. Eliminates boilerplate by turning a single config into a full set of ready-to-use artifacts for your Next.js project (App Router and Pages Router).

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Usage](#cli-usage)
  - [Generate (default)](#generate-default)
  - [Create Command](#create-command)
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
  npx route-action-gen [options]           Scan and generate code
  npx route-action-gen create <method> [directory]
                                           Scaffold a new config file

Commands:
  create <method> [dir]   Create a route.<method>.config.ts file.
                          Methods: get, post, put, delete, patch, options, head
                          Directory defaults to the current directory.
                          Use --force to overwrite an existing file.

Options:
  --help                Show this help message
  --version             Show version number
  --framework <name>    Framework target (default: auto)
                        Use "auto" to detect per directory (pages/ vs app/).
  --force               Overwrite existing file (for create command)

Available frameworks:
  auto, next-app-router, next-pages-router
```

### Generate (default)

When run without a command, the CLI scans for config files and generates code.

#### How It Works

1. **Scan** - Recursively finds all `route.[method].config.ts` files in the current directory
2. **Group** - Groups config files by their parent directory (multiple methods per directory are supported)
3. **Parse** - Extracts metadata from each config file (validators, fields, auth presence)
4. **Generate** - Produces framework-specific files using templates
5. **Write** - Outputs generated files to a `.generated/` subdirectory alongside the config files
6. **Entry Point** - Creates an entry point file (`route.ts` for App Router, `index.ts` for Pages Router) if one doesn't already exist

#### Example Output

```
route-action-gen v0.0.0
Framework: auto (detect per directory)
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
  - README.md
  Created entry point: /Users/you/my-app/app/api/posts/[postId]/route.ts

Done! Generated 9 file(s) in 1 directory(ies).
```

### Create Command

Scaffold a new config file with all required exports pre-filled:

```bash
# Create a POST config in the current directory
npx route-action-gen create post

# Create a GET config in a specific directory
npx route-action-gen create get app/api/posts/[postId]

# Overwrite an existing config file
npx route-action-gen create post --force
```

Body methods (`post`, `put`, `patch`) generate a template with a `body` validator. Non-body methods (`get`, `delete`, `options`, `head`) generate a simpler template without a body section.

### Supported Frameworks

| Framework            | Flag Value          | Description                                                                      |
| -------------------- | ------------------- | -------------------------------------------------------------------------------- |
| Auto-detect          | `auto`              | Default. Detects per directory: `pages/` uses Pages Router, otherwise App Router |
| Next.js App Router   | `next-app-router`   | Generates for Next.js App Router (route handlers, server actions, etc.)          |
| Next.js Pages Router | `next-pages-router` | Generates for Next.js Pages Router (API routes with default export)              |

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

The files generated depend on the HTTP method and the framework. All files are output to a `.generated/` subdirectory. An entry point file is also created in the parent directory if it doesn't already exist.

### Entry Point File

The CLI creates an entry point file in the same directory as the config files (not inside `.generated/`) the first time it runs. This file re-exports from the generated route handler so Next.js can discover it:

- **App Router**: `route.ts` containing `export * from "./.generated/route";`
- **Pages Router**: `index.ts` containing `export { default } from "./.generated/route";`

If the entry point file already exists, it will **not** be overwritten.

### Files Generated for All Methods (App Router & Pages Router)

| File                     | Description                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `route.ts`               | Route handler. App Router exports named functions (`GET`, `POST`, etc.); Pages Router exports a default handler |
| `client.ts`              | `RouteClient` class with typed methods for each HTTP method (non-React use)                                     |
| `use-route-[method].tsx` | React hook for the HTTP method                                                                                  |
| `README.md`              | Auto-generated documentation for the generated files                                                            |

### Additional Files for Body Methods (POST, PUT, PATCH) -- App Router Only

| File                      | Description                                                     |
| ------------------------- | --------------------------------------------------------------- |
| `server.function.ts`      | Next.js server action wrapping the handler (`"use server"`)     |
| `form.action.ts`          | Next.js form action wrapping the handler (`"use server"`)       |
| `use-server-function.tsx` | React hook for calling the server function with `useTransition` |
| `use-form-action.tsx`     | React hook for form actions using `useActionState`              |

### Additional Files When Body/Param Fields Exist (App Router & Pages Router)

| File                  | Description                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `form-components.tsx` | Auto-generated form input/label components from your Zod schemas |

> **Note:** Server functions and form actions (`server.function.ts`, `form.action.ts`, `use-server-function.tsx`, `use-form-action.tsx`) are **not** generated for Pages Router, as `"use server"` directives are an App Router feature.

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

| Entry Point                       | Description                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `route-action-gen/lib`            | Core utilities: `createRequestValidator`, `successResponse`, `errorResponse`, `HandlerFunc`, `AuthFunc`, `mapZodError` |
| `route-action-gen/lib/next`       | Next.js App Router helpers: `createRoute`, `createServerFunction`, `createFormAction`                                  |
| `route-action-gen/lib/next/pages` | Next.js Pages Router helpers: `createPagesRoute`                                                                       |
| `route-action-gen/lib/react`      | React helpers: `createInput`, `createLabel`, `createFormWithAction`                                                    |
| `route-action-gen/lib/node`       | Node.js helpers for server-side usage                                                                                  |

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

### App Router

A typical App Router project using `route-action-gen` looks like this:

```
app/
  api/
    posts/
      [postId]/
        route.get.config.ts        # Your config (you write this)
        route.post.config.ts       # Your config (you write this)
        route.ts                   # Entry point (auto-created if missing)
        .generated/                # Auto-generated (do not edit)
          route.ts                 #   Next.js route handler (named exports)
          client.ts                #   RouteClient class
          use-route-get.tsx        #   GET hook
          use-route-post.tsx       #   POST hook
          server.function.ts       #   Server function
          form.action.ts           #   Form action
          use-server-function.tsx   #   Server function hook
          use-form-action.tsx       #   Form action hook
          form-components.tsx       #   Form components
          README.md                #   Generated documentation
```

### Pages Router

Pages Router projects are also supported. Config files placed under `pages/` are automatically detected:

```
pages/
  api/
    users/
      [userId]/
        route.get.config.ts        # Your config (you write this)
        route.post.config.ts       # Your config (you write this)
        index.ts                   # Entry point (auto-created if missing)
        .generated/                # Auto-generated (do not edit)
          route.ts                 #   API route handler (default export)
          client.ts                #   RouteClient class
          use-route-get.tsx        #   GET hook
          use-route-post.tsx       #   POST hook
          form-components.tsx       #   Form components
          README.md                #   Generated documentation
```

> **Note:** Pages Router does not generate `server.function.ts`, `form.action.ts`, `use-server-function.tsx`, or `use-form-action.tsx` since server actions are an App Router feature.

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
