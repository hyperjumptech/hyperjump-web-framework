import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock node:fs and glob before any imports that depend on them
vi.mock("node:fs", () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(),
  },
}));

vi.mock("glob", () => ({
  globSync: vi.fn().mockReturnValue([]),
}));

import { parseArgs, main, VERSION, HELP_TEXT } from "./index.js";
import fs from "node:fs";
import { globSync } from "glob";

// ---------------------------------------------------------------------------
// Sample config fixtures
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

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

describe("parseArgs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns default values when no arguments are provided", () => {
    // Act
    const result = parseArgs([]);

    // Assert
    expect(result.command).toBe("generate");
    expect(result.help).toBe(false);
    expect(result.version).toBe(false);
    expect(result.framework).toBe("auto");
    expect(result.force).toBe(false);
  });

  it("sets help to true when --help flag is passed", () => {
    // Act
    const result = parseArgs(["--help"]);

    // Assert
    expect(result.help).toBe(true);
  });

  it("sets help to true when -h shorthand is passed", () => {
    // Act
    const result = parseArgs(["-h"]);

    // Assert
    expect(result.help).toBe(true);
  });

  it("sets version to true when --version flag is passed", () => {
    // Act
    const result = parseArgs(["--version"]);

    // Assert
    expect(result.version).toBe(true);
  });

  it("sets version to true when -v shorthand is passed", () => {
    // Act
    const result = parseArgs(["-v"]);

    // Assert
    expect(result.version).toBe(true);
  });

  it("sets framework when --framework is passed with a value", () => {
    // Act
    const result = parseArgs(["--framework", "custom-framework"]);

    // Assert
    expect(result.framework).toBe("custom-framework");
  });

  it("sets framework when -f shorthand is passed with a value", () => {
    // Act
    const result = parseArgs(["-f", "custom-framework"]);

    // Assert
    expect(result.framework).toBe("custom-framework");
  });

  it("exits with error when --framework is passed without a value", () => {
    // Setup
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: string | number | null,
    ) => {
      throw new Error("process.exit");
    }) as (code?: string | number | null) => never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act & Assert
    expect(() => parseArgs(["--framework"])).toThrow("process.exit");
    expect(errorSpy).toHaveBeenCalledWith(
      "Error: --framework requires a value",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with error when --framework value starts with a dash", () => {
    // Setup
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: string | number | null,
    ) => {
      throw new Error("process.exit");
    }) as (code?: string | number | null) => never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act & Assert
    expect(() => parseArgs(["--framework", "--other"])).toThrow("process.exit");
    expect(errorSpy).toHaveBeenCalledWith(
      "Error: --framework requires a value",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("handles multiple flags combined", () => {
    // Act
    const result = parseArgs([
      "--help",
      "--version",
      "--framework",
      "my-framework",
    ]);

    // Assert
    expect(result.help).toBe(true);
    expect(result.version).toBe(true);
    expect(result.framework).toBe("my-framework");
  });

  it("ignores unrecognized arguments", () => {
    // Act
    const result = parseArgs(["--unknown", "value", "--debug"]);

    // Assert
    expect(result.help).toBe(false);
    expect(result.version).toBe(false);
    expect(result.framework).toBe("auto");
  });

  // create subcommand
  it("parses create command with method", () => {
    // Act
    const result = parseArgs(["create", "get"]);

    // Assert
    expect(result.command).toBe("create");
    expect(result.createMethod).toBe("get");
    expect(result.createDir).toBe(".");
  });

  it("parses create command with method and directory", () => {
    // Act
    const result = parseArgs(["create", "post", "./app/api/users"]);

    // Assert
    expect(result.command).toBe("create");
    expect(result.createMethod).toBe("post");
    expect(result.createDir).toBe("./app/api/users");
  });

  it("parses create command with --force flag", () => {
    // Act
    const result = parseArgs(["create", "put", "./some/dir", "--force"]);

    // Assert
    expect(result.command).toBe("create");
    expect(result.createMethod).toBe("put");
    expect(result.createDir).toBe("./some/dir");
    expect(result.force).toBe(true);
  });

  it("accepts uppercase method and normalizes to lowercase", () => {
    // Act
    const result = parseArgs(["create", "POST"]);

    // Assert
    expect(result.createMethod).toBe("post");
  });

  it("exits with error when create is passed without a method", () => {
    // Setup
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: string | number | null,
    ) => {
      throw new Error("process.exit");
    }) as (code?: string | number | null) => never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act & Assert
    expect(() => parseArgs(["create"])).toThrow("process.exit");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("create requires an HTTP method"),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with error when create is passed with an invalid method", () => {
    // Setup
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: string | number | null,
    ) => {
      throw new Error("process.exit");
    }) as (code?: string | number | null) => never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act & Assert
    expect(() => parseArgs(["create", "foo"])).toThrow("process.exit");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid HTTP method "foo"'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("parses all supported HTTP methods for create", () => {
    const methods = [
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "options",
      "head",
    ];
    for (const method of methods) {
      // Act
      const result = parseArgs(["create", method]);

      // Assert
      expect(result.command).toBe("create");
      expect(result.createMethod).toBe(method);
    }
  });
});

// ---------------------------------------------------------------------------
// VERSION and HELP_TEXT
// ---------------------------------------------------------------------------

describe("VERSION", () => {
  it("is a defined string", () => {
    // Assert
    expect(VERSION).toBe("0.0.0");
  });
});

describe("HELP_TEXT", () => {
  it("contains usage and options information", () => {
    // Assert
    expect(HELP_TEXT).toContain("route-action-gen");
    expect(HELP_TEXT).toContain("Usage:");
    expect(HELP_TEXT).toContain("--help");
    expect(HELP_TEXT).toContain("--version");
    expect(HELP_TEXT).toContain("--framework");
    expect(HELP_TEXT).toContain("auto");
    expect(HELP_TEXT).toContain("next-app-router");
    expect(HELP_TEXT).toContain("next-pages-router");
  });
});

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

describe("main", () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(globSync).mockReturnValue([]);
    vi.mocked(fs.readFileSync).mockReturnValue("" as never);
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined as never);
    vi.mocked(fs.existsSync).mockReturnValue(false);
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  it("prints help text and exits with code 0 when --help is passed", () => {
    // Setup
    process.argv = ["node", "index.js", "--help"];
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: string | number | null,
    ) => {
      throw new Error("process.exit");
    }) as (code?: string | number | null) => never);

    // Act & Assert
    expect(() => main()).toThrow("process.exit");
    expect(logSpy).toHaveBeenCalledWith(HELP_TEXT);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("prints version and exits with code 0 when --version is passed", () => {
    // Setup
    process.argv = ["node", "index.js", "--version"];
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: string | number | null,
    ) => {
      throw new Error("process.exit");
    }) as (code?: string | number | null) => never);

    // Act & Assert
    expect(() => main()).toThrow("process.exit");
    expect(logSpy).toHaveBeenCalledWith(VERSION);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("prints error and exits with code 1 when no config files are found", () => {
    // Setup
    process.argv = ["node", "index.js"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: string | number | null,
    ) => {
      throw new Error("process.exit");
    }) as (code?: string | number | null) => never);
    vi.mocked(globSync).mockReturnValue([]);

    // Act & Assert
    expect(() => main()).toThrow("process.exit");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("No route config files found"),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prints error and exits with code 1 for an unknown framework", () => {
    // Setup
    process.argv = ["node", "index.js", "--framework", "nonexistent"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: string | number | null,
    ) => {
      throw new Error("process.exit");
    }) as (code?: string | number | null) => never);

    // Act & Assert
    expect(() => main()).toThrow("process.exit");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown framework: "nonexistent"'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("generates files and prints summary on success", () => {
    // Setup
    process.argv = ["node", "index.js"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(globSync).mockReturnValue([
      "app/api/posts/route.post.config.ts",
    ] as never);
    vi.mocked(fs.readFileSync).mockReturnValue(samplePostConfig as never);

    // Act
    main();

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("route-action-gen"),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Framework: auto"),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Scanning for config files"),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Done!"));
    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it("prints generated files per directory on success", () => {
    // Setup
    process.argv = ["node", "index.js"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(globSync).mockReturnValue([
      "app/api/posts/route.post.config.ts",
      "app/api/users/route.get.config.ts",
    ] as never);
    vi.mocked(fs.readFileSync).mockImplementation(((filePath: string) => {
      if (filePath.includes("route.get")) return sampleGetConfig;
      return samplePostConfig;
    }) as typeof fs.readFileSync);

    // Act
    main();

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Generated in"),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Done!"));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("2 directory(ies)"),
    );
  });

  it("prints individual file names for each generated directory", () => {
    // Setup
    process.argv = ["node", "index.js"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(globSync).mockReturnValue([
      "app/api/posts/route.post.config.ts",
    ] as never);
    vi.mocked(fs.readFileSync).mockReturnValue(samplePostConfig as never);

    // Act
    main();

    // Assert
    expect(logSpy).toHaveBeenCalledWith("  - route.ts");
    expect(logSpy).toHaveBeenCalledWith("  - client.ts");
  });

  it("uses the specified framework when --framework flag is provided", () => {
    // Setup
    process.argv = ["node", "index.js", "--framework", "next-app-router"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(globSync).mockReturnValue([
      "app/api/posts/route.post.config.ts",
    ] as never);
    vi.mocked(fs.readFileSync).mockReturnValue(samplePostConfig as never);

    // Act
    main();

    // Assert
    expect(logSpy).toHaveBeenCalledWith("Framework: next-app-router");
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Done!"));
  });

  it("prints detect per directory message when using auto framework", () => {
    // Setup
    process.argv = ["node", "index.js"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(globSync).mockReturnValue([
      "app/api/posts/route.post.config.ts",
    ] as never);
    vi.mocked(fs.readFileSync).mockReturnValue(samplePostConfig as never);

    // Act
    main();

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      "Framework: auto (detect per directory)",
    );
  });

  it("creates app router entry point file when it does not exist", () => {
    // Setup
    process.argv = ["node", "index.js"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(globSync).mockReturnValue([
      "app/api/posts/route.post.config.ts",
    ] as never);
    vi.mocked(fs.readFileSync).mockReturnValue(samplePostConfig as never);
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Act
    main();

    // Assert
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/test-project/app/api/posts/route.ts",
      'export * from "./.generated/route";\n',
      "utf-8",
    );
  });

  it("creates pages router entry point file when it does not exist", () => {
    // Setup
    process.argv = ["node", "index.js"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(globSync).mockReturnValue([
      "pages/api/users/route.post.config.ts",
    ] as never);
    vi.mocked(fs.readFileSync).mockReturnValue(samplePostConfig as never);
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Act
    main();

    // Assert
    // Pages Router generates files to .generated/ at the project root,
    // so the entry point import path is relative from pages/api/users/ to .generated/pages/api/users/
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/test-project/pages/api/users/index.ts",
      'export { default } from "../../../.generated/pages/api/users/route";\n',
      "utf-8",
    );
  });

  it("does not overwrite existing entry point file", () => {
    // Setup
    process.argv = ["node", "index.js"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(globSync).mockReturnValue([
      "app/api/posts/route.post.config.ts",
    ] as never);
    vi.mocked(fs.readFileSync).mockReturnValue(samplePostConfig as never);
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // Act
    main();

    // Assert
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
      "/test-project/app/api/posts/route.ts",
      expect.any(String),
      "utf-8",
    );
  });

  it("prints entry point creation message when file is created", () => {
    // Setup
    process.argv = ["node", "index.js"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(globSync).mockReturnValue([
      "app/api/posts/route.post.config.ts",
    ] as never);
    vi.mocked(fs.readFileSync).mockReturnValue(samplePostConfig as never);
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Act
    main();

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      "  Created entry point: /test-project/app/api/posts/route.ts",
    );
  });

  it("does not print entry point creation message when file already exists", () => {
    // Setup
    process.argv = ["node", "index.js"];
    vi.spyOn(process, "cwd").mockReturnValue("/test-project");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(globSync).mockReturnValue([
      "app/api/posts/route.post.config.ts",
    ] as never);
    vi.mocked(fs.readFileSync).mockReturnValue(samplePostConfig as never);
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // Act
    main();

    // Assert
    const entryPointCalls = logSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === "string" && call[0].includes("Created entry point"),
    );
    expect(entryPointCalls).toHaveLength(0);
  });
});
