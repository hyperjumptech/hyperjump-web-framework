import { describe, it, expect } from "vitest";
import {
  pascalCase,
  camelCase,
  extractDynamicSegments,
  buildFetchUrlExpression,
  zodTypeToInputType,
  fieldNameToLabel,
  scanConfigFiles,
  parseConfigFile,
  extractZodObjectFields,
  generate,
  getFrameworkGenerator,
  getAvailableFrameworks,
  detectFrameworkGenerator,
  DEFAULT_FRAMEWORK,
} from "./cli/index.js";
import type { CliDeps } from "./cli/types.js";
import { extractMethod } from "./cli/scanner.js";

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

describe("pascalCase", () => {
  it("converts kebab-case", () => {
    expect(pascalCase("add-admin")).toBe("AddAdmin");
    expect(pascalCase("post-id")).toBe("PostId");
  });
  it("converts snake_case", () => {
    expect(pascalCase("foo_bar")).toBe("FooBar");
  });
  it("handles single word", () => {
    expect(pascalCase("get")).toBe("Get");
  });
});

describe("camelCase", () => {
  it("converts kebab-case", () => {
    expect(camelCase("add-admin")).toBe("addAdmin");
  });
  it("converts snake_case", () => {
    expect(camelCase("foo_bar")).toBe("fooBar");
  });
  it("handles single word", () => {
    expect(camelCase("post")).toBe("post");
  });
});

describe("extractDynamicSegments", () => {
  it("extracts single segment", () => {
    expect(extractDynamicSegments("/api/posts/[postId]")).toEqual(["postId"]);
  });
  it("extracts multiple segments", () => {
    expect(extractDynamicSegments("/api/[orgId]/posts/[postId]")).toEqual([
      "orgId",
      "postId",
    ]);
  });
  it("returns empty array for no segments", () => {
    expect(extractDynamicSegments("/api/posts")).toEqual([]);
  });
});

describe("buildFetchUrlExpression", () => {
  it("builds template literal with params", () => {
    expect(
      buildFetchUrlExpression("/api/posts/[postId]", "inputData.params"),
    ).toBe("`/api/posts/${inputData.params.postId}`");
  });
  it("handles multiple segments", () => {
    expect(buildFetchUrlExpression("/api/[orgId]/posts/[postId]", "p")).toBe(
      "`/api/${p.orgId}/posts/${p.postId}`",
    );
  });
  it("handles no dynamic segments", () => {
    expect(buildFetchUrlExpression("/api/posts", "p")).toBe("`/api/posts`");
  });
});

describe("zodTypeToInputType", () => {
  it("maps string to text", () => {
    expect(zodTypeToInputType("string")).toBe("text");
  });
  it("maps number to number", () => {
    expect(zodTypeToInputType("number")).toBe("number");
  });
  it("maps boolean to checkbox", () => {
    expect(zodTypeToInputType("boolean")).toBe("checkbox");
  });
  it("defaults to text for unknown", () => {
    expect(zodTypeToInputType("enum")).toBe("text");
  });
});

describe("fieldNameToLabel", () => {
  it("splits camelCase", () => {
    expect(fieldNameToLabel("postId")).toBe("Post Id");
    expect(fieldNameToLabel("firstName")).toBe("First Name");
  });
  it("handles simple names", () => {
    expect(fieldNameToLabel("title")).toBe("Title");
  });
});

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

describe("extractMethod", () => {
  it("extracts post from route.post.config.ts", () => {
    expect(extractMethod("route.post.config.ts")).toBe("post");
  });
  it("extracts get from route.get.config.ts", () => {
    expect(extractMethod("route.get.config.ts")).toBe("get");
  });
  it("extracts delete from route.delete.config.ts", () => {
    expect(extractMethod("route.delete.config.ts")).toBe("delete");
  });
  it("returns null for non-config files", () => {
    expect(extractMethod("route.ts")).toBeNull();
    expect(extractMethod("config.ts")).toBeNull();
    expect(extractMethod("route.unknown.config.ts")).toBeNull();
  });
});

describe("scanConfigFiles", () => {
  it("groups config files by directory", () => {
    const mockGlob = () => [
      "app/api/posts/[postId]/route.post.config.ts",
      "app/api/posts/[postId]/route.get.config.ts",
      "app/api/users/route.get.config.ts",
    ];

    const groups = scanConfigFiles(mockGlob, "/project");

    expect(groups).toHaveLength(2);

    // Groups are sorted by directory
    const postGroup = groups.find((g) => g.directory.includes("posts"));
    const userGroup = groups.find((g) => g.directory.includes("users"));

    expect(postGroup).toBeDefined();
    expect(postGroup!.configs).toHaveLength(2);
    // Configs sorted by method
    expect(postGroup!.configs[0]!.method).toBe("get");
    expect(postGroup!.configs[1]!.method).toBe("post");

    expect(userGroup).toBeDefined();
    expect(userGroup!.configs).toHaveLength(1);
    expect(userGroup!.configs[0]!.method).toBe("get");
  });

  it("returns empty array when no files found", () => {
    const groups = scanConfigFiles(() => [], "/project");
    expect(groups).toEqual([]);
  });

  it("ignores files with invalid method names", () => {
    const mockGlob = () => ["app/api/route.unknown.config.ts"];
    const groups = scanConfigFiles(mockGlob, "/project");
    expect(groups).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

const samplePostConfig = `
import { z } from "zod";
import {
  AuthFunc,
  createRequestValidator,
  successResponse,
  errorResponse,
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

const minimalConfig = `
import { z } from "zod";
import { createRequestValidator, HandlerFunc } from "route-action-gen/lib";

export const requestValidator = createRequestValidator({});

export const responseValidator = z.object({
  ok: z.boolean(),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async () => {
  return successResponse({ ok: true });
};
`;

describe("parseConfigFile", () => {
  it("parses a POST config with body, params, and auth", () => {
    const result = parseConfigFile(
      samplePostConfig,
      "post",
      "route.post.config.ts",
    );

    expect(result.method).toBe("post");
    expect(result.configFileName).toBe("route.post.config.ts");
    expect(result.hasBody).toBe(true);
    expect(result.hasParams).toBe(true);
    expect(result.hasAuth).toBe(true);
    expect(result.hasHeaders).toBe(false);
    expect(result.hasSearchParams).toBe(false);

    expect(result.bodyFields).toEqual([
      { name: "title", zodType: "string" },
      { name: "content", zodType: "string" },
    ]);

    expect(result.paramFields).toEqual([{ name: "postId", zodType: "string" }]);
  });

  it("parses a GET config with only params", () => {
    const result = parseConfigFile(
      sampleGetConfig,
      "get",
      "route.get.config.ts",
    );

    expect(result.method).toBe("get");
    expect(result.hasBody).toBe(false);
    expect(result.hasParams).toBe(true);
    expect(result.hasAuth).toBe(false);
    expect(result.paramFields).toEqual([{ name: "postId", zodType: "string" }]);
    expect(result.bodyFields).toEqual([]);
  });

  it("parses a minimal config with no validators", () => {
    const result = parseConfigFile(minimalConfig, "get", "route.get.config.ts");

    expect(result.hasBody).toBe(false);
    expect(result.hasParams).toBe(false);
    expect(result.hasAuth).toBe(false);
    expect(result.hasHeaders).toBe(false);
    expect(result.hasSearchParams).toBe(false);
    expect(result.bodyFields).toEqual([]);
    expect(result.paramFields).toEqual([]);
  });

  it("parses config with searchParams and headers", () => {
    const configWithAll = `
import { z } from "zod";
import { createRequestValidator } from "route-action-gen/lib";

const searchParamsValidator = z.object({
  page: z.number(),
  limit: z.number(),
});

const headersValidator = z.object({
  authorization: z.string(),
});

export const requestValidator = createRequestValidator({
  searchParams: searchParamsValidator,
  headers: headersValidator,
});

export const responseValidator = z.object({ ok: z.boolean() });
export const handler = async () => ({ status: true, statusCode: 200, data: { ok: true } });
`;

    const result = parseConfigFile(configWithAll, "get", "route.get.config.ts");

    expect(result.hasSearchParams).toBe(true);
    expect(result.hasHeaders).toBe(true);
    expect(result.hasBody).toBe(false);
    expect(result.searchParamFields).toEqual([
      { name: "page", zodType: "number" },
      { name: "limit", zodType: "number" },
    ]);
  });
});

describe("extractZodObjectFields", () => {
  it("extracts fields from a z.object definition", () => {
    const source = `
const mySchema = z.object({
  name: z.string(),
  age: z.number(),
  active: z.boolean(),
});
`;
    const fields = extractZodObjectFields(source, "mySchema");
    expect(fields).toEqual([
      { name: "name", zodType: "string" },
      { name: "age", zodType: "number" },
      { name: "active", zodType: "boolean" },
    ]);
  });

  it("returns empty array for non-existent variable", () => {
    const source = `const foo = z.object({ name: z.string() });`;
    expect(extractZodObjectFields(source, "bar")).toEqual([]);
  });

  it("handles fields with chained methods", () => {
    const source = `
const validator = z.object({
  email: z.string().email().min(1),
  count: z.number().min(0).max(100),
});
`;
    const fields = extractZodObjectFields(source, "validator");
    expect(fields).toEqual([
      { name: "email", zodType: "string" },
      { name: "count", zodType: "number" },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Framework registry
// ---------------------------------------------------------------------------

describe("framework registry", () => {
  it("returns the next-app-router generator", () => {
    const generator = getFrameworkGenerator("next-app-router");
    expect(generator).toBeDefined();
    expect(generator!.name).toBe("next-app-router");
  });

  it("returns the next-pages-router generator", () => {
    const generator = getFrameworkGenerator("next-pages-router");
    expect(generator).toBeDefined();
    expect(generator!.name).toBe("next-pages-router");
  });

  it("returns undefined for unknown framework", () => {
    expect(getFrameworkGenerator("unknown")).toBeUndefined();
  });

  it("lists available frameworks", () => {
    const frameworks = getAvailableFrameworks();
    expect(frameworks).toContain("next-app-router");
    expect(frameworks).toContain("next-pages-router");
  });

  it("has auto as the default framework", () => {
    expect(DEFAULT_FRAMEWORK).toBe("auto");
  });

  it("detects App Router for directories under /app/", () => {
    const gen = detectFrameworkGenerator("/project/app/api/posts/[postId]");
    expect(gen.name).toBe("next-app-router");
  });

  it("detects Pages Router for directories under /pages/", () => {
    const gen = detectFrameworkGenerator("/project/pages/api/posts/[postId]");
    expect(gen.name).toBe("next-pages-router");
  });

  it("defaults to App Router for unknown paths", () => {
    const gen = detectFrameworkGenerator("/project/src/api/posts");
    expect(gen.name).toBe("next-app-router");
  });
});

// ---------------------------------------------------------------------------
// Next.js App Router Generator
// ---------------------------------------------------------------------------

describe("NextAppRouterGenerator", () => {
  const generator = getFrameworkGenerator("next-app-router")!;

  describe("resolveRoutePath", () => {
    it("extracts route path from app directory", () => {
      expect(
        generator.resolveRoutePath("/project/app/api/posts/[postId]"),
      ).toBe("/api/posts/[postId]");
    });

    it("handles nested app directories", () => {
      expect(
        generator.resolveRoutePath("/project/apps/web/app/api/users"),
      ).toBe("/api/users");
    });
  });

  describe("generate", () => {
    it("generates all files for POST + GET config", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/app/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig, postConfig],
      });

      const fileNames = files.map((f) => f.fileName).sort();

      expect(fileNames).toContain("route.ts");
      expect(fileNames).toContain("client.ts");
      expect(fileNames).toContain("use-route-get.tsx");
      expect(fileNames).toContain("use-route-post.tsx");
      expect(fileNames).toContain("server.function.ts");
      expect(fileNames).toContain("form.action.ts");
      expect(fileNames).toContain("use-server-function.tsx");
      expect(fileNames).toContain("use-form-action.tsx");
      expect(fileNames).toContain("form-components.tsx");
    });

    it("generates only route + client + hook for GET-only config", () => {
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/app/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig],
      });

      const fileNames = files.map((f) => f.fileName).sort();

      expect(fileNames).toContain("route.ts");
      expect(fileNames).toContain("client.ts");
      expect(fileNames).toContain("use-route-get.tsx");
      // Should NOT contain body-method-only files
      expect(fileNames).not.toContain("server.function.ts");
      expect(fileNames).not.toContain("form.action.ts");
      expect(fileNames).not.toContain("use-server-function.tsx");
      expect(fileNames).not.toContain("use-form-action.tsx");
      expect(fileNames).not.toContain("form-components.tsx");
    });

    it("route.ts imports from all config files", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/app/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig, postConfig],
      });

      const routeFile = files.find((f) => f.fileName === "route.ts")!;
      expect(routeFile.content).toContain("createRoute");
      expect(routeFile.content).toContain("export const POST");
      expect(routeFile.content).toContain("export const GET");
      expect(routeFile.content).toContain("route.post.config");
      expect(routeFile.content).toContain("route.get.config");
    });

    it("client.ts generates methods for each HTTP method", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/app/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig, postConfig],
      });

      const clientFile = files.find((f) => f.fileName === "client.ts")!;
      expect(clientFile.content).toContain("export class RouteClient");
      expect(clientFile.content).toContain("async post(");
      expect(clientFile.content).toContain("async get(");
      expect(clientFile.content).toContain("inputData.params.postId");
    });

    it("use-route-post.tsx generates mutation hook", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );

      const files = generator.generate({
        directory: "/project/app/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [postConfig],
      });

      const hook = files.find((f) => f.fileName === "use-route-post.tsx")!;
      expect(hook.content).toContain("export const useRoutePost");
      expect(hook.content).toContain("fetchData");
      expect(hook.content).toContain("isLoading");
      expect(hook.content).toContain("route.post.config");
    });

    it("use-route-get.tsx generates auto-fetch hook", () => {
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/app/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig],
      });

      const hook = files.find((f) => f.fileName === "use-route-get.tsx")!;
      expect(hook.content).toContain("export const useRouteGet");
      expect(hook.content).toContain("useEffect");
      expect(hook.content).toContain("cancel");
      expect(hook.content).toContain("refetch");
      expect(hook.content).toContain("route.get.config");
    });

    it("form-components.tsx generates input/label for body fields", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );

      const files = generator.generate({
        directory: "/project/app/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [postConfig],
      });

      const formComp = files.find((f) => f.fileName === "form-components.tsx")!;
      expect(formComp.content).toContain('"body.title"');
      expect(formComp.content).toContain('"body.content"');
      expect(formComp.content).toContain('"params.postId"');
      expect(formComp.content).toContain("createInput");
      expect(formComp.content).toContain("createLabel");
    });

    it("server.function.ts wraps POST handler", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );

      const files = generator.generate({
        directory: "/project/app/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [postConfig],
      });

      const sf = files.find((f) => f.fileName === "server.function.ts")!;
      expect(sf.content).toContain('"use server"');
      expect(sf.content).toContain("createServerFunction");
      expect(sf.content).toContain("route.post.config");
    });

    it("form.action.ts wraps POST handler as form action", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );

      const files = generator.generate({
        directory: "/project/app/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [postConfig],
      });

      const fa = files.find((f) => f.fileName === "form.action.ts")!;
      expect(fa.content).toContain('"use server"');
      expect(fa.content).toContain("createFormAction");
      expect(fa.content).toContain("route.post.config");
    });

    it("all generated files have the auto-generated header", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/app/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig, postConfig],
      });

      for (const file of files) {
        // server.function.ts has "use server" first but still counts
        const hasHeader =
          file.content.includes("AUTOMATICALLY GENERATED") ||
          file.content.includes('"use server"');
        expect(hasHeader).toBe(true);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Next.js Pages Router Generator
// ---------------------------------------------------------------------------

describe("NextPagesRouterGenerator", () => {
  const generator = getFrameworkGenerator("next-pages-router")!;

  describe("resolveRoutePath", () => {
    it("extracts route path from pages directory", () => {
      expect(
        generator.resolveRoutePath("/project/pages/api/posts/[postId]"),
      ).toBe("/api/posts/[postId]");
    });

    it("handles nested pages directories", () => {
      expect(generator.resolveRoutePath("/project/src/pages/api/users")).toBe(
        "/api/users",
      );
    });
  });

  describe("generate", () => {
    it("generates correct files for POST + GET config (no server actions)", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/pages/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig, postConfig],
      });

      const fileNames = files.map((f) => f.fileName).sort();

      // Should contain these files
      expect(fileNames).toContain("route.ts");
      expect(fileNames).toContain("client.ts");
      expect(fileNames).toContain("use-route-get.tsx");
      expect(fileNames).toContain("use-route-post.tsx");
      expect(fileNames).toContain("form-components.tsx");
      expect(fileNames).toContain("README.md");

      // Should NOT contain App Router-only files
      expect(fileNames).not.toContain("server.function.ts");
      expect(fileNames).not.toContain("form.action.ts");
      expect(fileNames).not.toContain("use-server-function.tsx");
      expect(fileNames).not.toContain("use-form-action.tsx");
    });

    it("generates only route + client + hook + readme for GET-only config", () => {
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/pages/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig],
      });

      const fileNames = files.map((f) => f.fileName).sort();

      expect(fileNames).toContain("route.ts");
      expect(fileNames).toContain("client.ts");
      expect(fileNames).toContain("use-route-get.tsx");
      expect(fileNames).toContain("README.md");
      // No body methods → no form-components
      expect(fileNames).not.toContain("form-components.tsx");
      expect(fileNames).not.toContain("server.function.ts");
      expect(fileNames).not.toContain("form.action.ts");
    });

    it("route.ts uses createPagesRoute with default export", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/pages/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig, postConfig],
      });

      const routeFile = files.find((f) => f.fileName === "route.ts")!;
      expect(routeFile.content).toContain("createPagesRoute");
      expect(routeFile.content).toContain("export default");
      expect(routeFile.content).toContain("route.post.config");
      expect(routeFile.content).toContain("route.get.config");
      expect(routeFile.content).toContain('"postId"');
      // Should NOT use App Router patterns
      expect(routeFile.content).not.toContain("export const GET");
      expect(routeFile.content).not.toContain("export const POST");
    });

    it("route.ts includes dynamic segment param names", () => {
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/pages/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig],
      });

      const routeFile = files.find((f) => f.fileName === "route.ts")!;
      expect(routeFile.content).toContain('["postId"]');
    });

    it("client.ts generates methods for each HTTP method", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/pages/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig, postConfig],
      });

      const clientFile = files.find((f) => f.fileName === "client.ts")!;
      expect(clientFile.content).toContain("export class RouteClient");
      expect(clientFile.content).toContain("async post(");
      expect(clientFile.content).toContain("async get(");
    });

    it("all generated files have the auto-generated header", () => {
      const postConfig = parseConfigFile(
        samplePostConfig,
        "post",
        "route.post.config.ts",
      );
      const getConfig = parseConfigFile(
        sampleGetConfig,
        "get",
        "route.get.config.ts",
      );

      const files = generator.generate({
        directory: "/project/pages/api/posts/[postId]",
        routePath: "/api/posts/[postId]",
        configs: [getConfig, postConfig],
      });

      for (const file of files) {
        const hasHeader = file.content.includes("AUTOMATICALLY GENERATED");
        expect(hasHeader).toBe(true);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// End-to-end: generate function
// ---------------------------------------------------------------------------

describe("generate (end-to-end)", () => {
  it("generates files for a project with POST + GET configs", () => {
    const writtenFiles: Record<string, string> = {};
    const createdDirs: string[] = [];

    const deps: CliDeps = {
      globSync: () => [
        "app/api/posts/[postId]/route.post.config.ts",
        "app/api/posts/[postId]/route.get.config.ts",
      ],
      readFileSync: (filePath: string) => {
        if (filePath.includes("route.post.config")) return samplePostConfig;
        if (filePath.includes("route.get.config")) return sampleGetConfig;
        return "";
      },
      writeFileSync: (filePath: string, content: string) => {
        writtenFiles[filePath] = content;
      },
      mkdirSync: (dirPath: string) => {
        createdDirs.push(dirPath);
      },
      existsSync: () => false,
      cwd: () => "/project",
    };

    const result = generate(deps, "next-app-router");

    expect(result.success).toBe(true);
    expect(result.generated).toHaveLength(1);
    expect(result.generated![0]!.files).toContain("route.ts");
    expect(result.generated![0]!.files).toContain("client.ts");
    expect(result.generated![0]!.files).toContain("use-route-get.tsx");
    expect(result.generated![0]!.files).toContain("use-route-post.tsx");

    // Verify .generated directory was created
    expect(createdDirs.length).toBeGreaterThan(0);
    expect(createdDirs[0]).toContain(".generated");

    // Verify files were written
    const fileKeys = Object.keys(writtenFiles);
    expect(fileKeys.length).toBeGreaterThan(0);
    expect(fileKeys.some((k) => k.endsWith("route.ts"))).toBe(true);
  });

  it("returns error for unknown framework", () => {
    const deps: CliDeps = {
      globSync: () => [],
      readFileSync: () => "",
      writeFileSync: () => {},
      mkdirSync: () => {},
      existsSync: () => false,
      cwd: () => "/project",
    };

    const result = generate(deps, "unknown-framework");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unknown framework");
  });

  it("returns error when no config files found", () => {
    const deps: CliDeps = {
      globSync: () => [],
      readFileSync: () => "",
      writeFileSync: () => {},
      mkdirSync: () => {},
      existsSync: () => false,
      cwd: () => "/project",
    };

    const result = generate(deps, "auto");
    expect(result.success).toBe(false);
    expect(result.error).toContain("No route config files found");
  });

  it("handles multiple directories", () => {
    const deps: CliDeps = {
      globSync: () => [
        "app/api/posts/[postId]/route.post.config.ts",
        "app/api/users/route.get.config.ts",
      ],
      readFileSync: (filePath: string) => {
        if (filePath.includes("route.post.config")) return samplePostConfig;
        return sampleGetConfig;
      },
      writeFileSync: () => {},
      mkdirSync: () => {},
      existsSync: () => false,
      cwd: () => "/project",
    };

    const result = generate(deps, "next-app-router");

    expect(result.success).toBe(true);
    expect(result.generated).toHaveLength(2);
  });

  it("generates files for Pages Router framework", () => {
    const writtenFiles: Record<string, string> = {};
    const createdDirs: string[] = [];

    const deps: CliDeps = {
      globSync: () => [
        "pages/api/posts/[postId]/route.post.config.ts",
        "pages/api/posts/[postId]/route.get.config.ts",
      ],
      readFileSync: (filePath: string) => {
        if (filePath.includes("route.post.config")) return samplePostConfig;
        if (filePath.includes("route.get.config")) return sampleGetConfig;
        return "";
      },
      writeFileSync: (filePath: string, content: string) => {
        writtenFiles[filePath] = content;
      },
      mkdirSync: (dirPath: string) => {
        createdDirs.push(dirPath);
      },
      existsSync: () => false,
      cwd: () => "/project",
    };

    const result = generate(deps, "next-pages-router");

    expect(result.success).toBe(true);
    expect(result.generated).toHaveLength(1);
    expect(result.generated![0]!.files).toContain("route.ts");
    expect(result.generated![0]!.files).toContain("client.ts");
    expect(result.generated![0]!.files).toContain("use-route-get.tsx");
    expect(result.generated![0]!.files).toContain("use-route-post.tsx");
    expect(result.generated![0]!.files).toContain("form-components.tsx");
    expect(result.generated![0]!.files).toContain("README.md");

    // Should NOT contain App Router-only files
    expect(result.generated![0]!.files).not.toContain("server.function.ts");
    expect(result.generated![0]!.files).not.toContain("form.action.ts");
    expect(result.generated![0]!.files).not.toContain(
      "use-server-function.tsx",
    );
    expect(result.generated![0]!.files).not.toContain("use-form-action.tsx");

    // Verify .generated directory was created
    expect(createdDirs.length).toBeGreaterThan(0);
    expect(createdDirs[0]).toContain(".generated");

    // Verify route.ts uses createPagesRoute
    const routeContent = Object.entries(writtenFiles).find(([k]) =>
      k.endsWith("route.ts"),
    )?.[1];
    expect(routeContent).toContain("createPagesRoute");
    expect(routeContent).toContain("export default");
  });

  it("auto-detects App Router for configs under app/", () => {
    const writtenFiles: Record<string, string> = {};

    const deps: CliDeps = {
      globSync: () => ["app/api/posts/[postId]/route.get.config.ts"],
      readFileSync: () => sampleGetConfig,
      writeFileSync: (filePath: string, content: string) => {
        writtenFiles[filePath] = content;
      },
      mkdirSync: () => {},
      existsSync: () => false,
      cwd: () => "/project",
    };

    const result = generate(deps, "auto");

    expect(result.success).toBe(true);
    const routeContent = Object.entries(writtenFiles).find(([k]) =>
      k.endsWith("route.ts"),
    )?.[1];
    // App Router uses createRoute with named exports
    expect(routeContent).toContain("createRoute");
    expect(routeContent).toContain("export const GET");
  });

  it("auto-detects Pages Router for configs under pages/", () => {
    const writtenFiles: Record<string, string> = {};

    const deps: CliDeps = {
      globSync: () => ["pages/api/posts/[postId]/route.get.config.ts"],
      readFileSync: () => sampleGetConfig,
      writeFileSync: (filePath: string, content: string) => {
        writtenFiles[filePath] = content;
      },
      mkdirSync: () => {},
      existsSync: () => false,
      cwd: () => "/project",
    };

    const result = generate(deps, "auto");

    expect(result.success).toBe(true);
    const routeContent = Object.entries(writtenFiles).find(([k]) =>
      k.endsWith("route.ts"),
    )?.[1];
    // Pages Router uses createPagesRoute with default export
    expect(routeContent).toContain("createPagesRoute");
    expect(routeContent).toContain("export default");
  });

  it("auto-detects mixed App Router and Pages Router in the same project", () => {
    const writtenFiles: Record<string, string> = {};

    const deps: CliDeps = {
      globSync: () => [
        "app/api/posts/[postId]/route.get.config.ts",
        "pages/api/users/route.get.config.ts",
      ],
      readFileSync: () => sampleGetConfig,
      writeFileSync: (filePath: string, content: string) => {
        writtenFiles[filePath] = content;
      },
      mkdirSync: () => {},
      existsSync: () => false,
      cwd: () => "/project",
    };

    const result = generate(deps, "auto");

    expect(result.success).toBe(true);
    expect(result.generated).toHaveLength(2);

    // App Router directory should use createRoute
    const appRouteContent = Object.entries(writtenFiles).find(
      ([k]) => k.includes("/app/") && k.endsWith("route.ts"),
    )?.[1];
    expect(appRouteContent).toContain("createRoute");
    expect(appRouteContent).toContain("export const GET");

    // Pages Router directory should use createPagesRoute
    const pagesRouteContent = Object.entries(writtenFiles).find(
      ([k]) => k.includes("/pages/") && k.endsWith("route.ts"),
    )?.[1];
    expect(pagesRouteContent).toContain("createPagesRoute");
    expect(pagesRouteContent).toContain("export default");
  });
});
