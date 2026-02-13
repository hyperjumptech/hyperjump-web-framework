/**
 * Fixture tests for the Next.js Pages Router generator.
 *
 * These tests run the generator against representative input configs and
 * snapshot each generated file using `toMatchFileSnapshot()`. The resulting
 * files live under `__fixtures__/` so developers can browse the generated
 * output directly in their IDE with full syntax highlighting.
 *
 * Generated content is formatted through Prettier before comparison so that
 * cosmetic formatting changes (trailing commas, line wrapping, etc.) never
 * cause spurious test failures.
 *
 * To update fixtures after template changes:
 *   pnpm vitest --update
 */

import path from "node:path";
import { describe, it, expect } from "vitest";
import * as prettier from "prettier";
import { NextPagesRouterGenerator } from "./next-pages-router.js";
import { parseConfigFile } from "../parser.js";
import type { HttpMethod } from "../types.js";

// ---------------------------------------------------------------------------
// Generator instance (pure — no mocks needed)
// ---------------------------------------------------------------------------

const generator = new NextPagesRouterGenerator();

// ---------------------------------------------------------------------------
// Sample config sources
// ---------------------------------------------------------------------------

const samplePostConfig = `
import { z } from "zod";
import {
  AuthFunc,
  createRequestValidator,
  successResponse,
  HandlerFunc,
} from "route-action-gen/lib";

const bodyValidator = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const paramsValidator = z.object({
  postId: z.string().min(1),
});

const auth: AuthFunc<User> = async () => {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
};

export const requestValidator = createRequestValidator({
  body: bodyValidator,
  params: paramsValidator,
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
  return successResponse({ id: "1" });
};
`;

const sampleGetConfig = `
import { z } from "zod";
import { createRequestValidator, HandlerFunc } from "route-action-gen/lib";

const paramsValidator = z.object({
  postId: z.string().min(1),
});

export const requestValidator = createRequestValidator({
  params: paramsValidator,
});

export const responseValidator = z.object({
  id: z.string().min(1),
  title: z.string(),
  content: z.string(),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  return successResponse({ id: "1", title: "Test", content: "Content" });
};
`;

const sampleDeleteConfig = `
import { z } from "zod";
import { createRequestValidator, HandlerFunc, successResponse } from "route-action-gen/lib";

const paramsValidator = z.object({
  postId: z.string().min(1),
});

export const requestValidator = createRequestValidator({
  params: paramsValidator,
});

export const responseValidator = z.object({
  success: z.boolean(),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  return successResponse({ success: true });
};
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format code with Prettier so cosmetic differences don't affect snapshots. */
async function fmt(code: string, fileName: string): Promise<string> {
  return prettier.format(code, {
    filepath: fileName,
  });
}

function parseAndGenerate(
  configs: { source: string; method: HttpMethod; fileName: string }[],
  routePath: string,
) {
  const parsedConfigs = configs.map((c) =>
    parseConfigFile(c.source, c.method, c.fileName),
  );

  // Simulate the CLI's configImportPrefix computation:
  // configDir = /test-project/pages/api/posts/[postId]
  // cwd = /test-project
  // generatedDir = /test-project/.generated/pages/api/posts/[postId]
  // configImportPrefix = relative(generatedDir, configDir) + "/"
  const cwd = "/test-project";
  const configDir = `${cwd}/pages${routePath}`;
  const generatedDir = generator.resolveGeneratedDir(configDir, cwd);
  const configImportPrefix = path.relative(generatedDir, configDir) + "/";

  return generator.generate({
    directory: configDir,
    routePath,
    configs: parsedConfigs,
    configImportPrefix,
  });
}

// ---------------------------------------------------------------------------
// Fixture tests
// ---------------------------------------------------------------------------

describe("Next Pages Router - generated file fixtures", () => {
  describe("POST with body + params + auth", () => {
    const files = parseAndGenerate(
      [
        {
          source: samplePostConfig,
          method: "post",
          fileName: "route.post.config.ts",
        },
      ],
      "/api/posts/[postId]",
    );

    it.each(files)("generates $fileName", async (file) => {
      const formatted = await fmt(file.content, file.fileName);
      await expect(formatted).toMatchFileSnapshot(
        `./__fixtures__/pages-post-with-body-params-auth/${file.fileName}`,
      );
    });
  });

  describe("GET with params", () => {
    const files = parseAndGenerate(
      [
        {
          source: sampleGetConfig,
          method: "get",
          fileName: "route.get.config.ts",
        },
      ],
      "/api/posts/[postId]",
    );

    it.each(files)("generates $fileName", async (file) => {
      const formatted = await fmt(file.content, file.fileName);
      await expect(formatted).toMatchFileSnapshot(
        `./__fixtures__/pages-get-with-params/${file.fileName}`,
      );
    });
  });

  describe("DELETE with params (no body)", () => {
    const files = parseAndGenerate(
      [
        {
          source: sampleDeleteConfig,
          method: "delete",
          fileName: "route.delete.config.ts",
        },
      ],
      "/api/posts/[postId]",
    );

    it.each(files)("generates $fileName", async (file) => {
      const formatted = await fmt(file.content, file.fileName);
      await expect(formatted).toMatchFileSnapshot(
        `./__fixtures__/pages-delete-with-params/${file.fileName}`,
      );
    });
  });

  describe("GET + POST combined", () => {
    const files = parseAndGenerate(
      [
        {
          source: sampleGetConfig,
          method: "get",
          fileName: "route.get.config.ts",
        },
        {
          source: samplePostConfig,
          method: "post",
          fileName: "route.post.config.ts",
        },
      ],
      "/api/posts/[postId]",
    );

    it.each(files)("generates $fileName", async (file) => {
      const formatted = await fmt(file.content, file.fileName);
      await expect(formatted).toMatchFileSnapshot(
        `./__fixtures__/pages-get-and-post-combined/${file.fileName}`,
      );
    });
  });
});
