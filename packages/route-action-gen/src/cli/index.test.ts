import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock node:fs and glob before any imports that depend on them
vi.mock("node:fs", () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}));

vi.mock("glob", () => ({
  globSync: vi.fn().mockReturnValue([]),
}));

import { parseArgs, main, VERSION, HELP_TEXT } from "./index";
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
    expect(result.help).toBe(false);
    expect(result.version).toBe(false);
    expect(result.framework).toBe("next-app-router");
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
    expect(result.framework).toBe("next-app-router");
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
    expect(HELP_TEXT).toContain("next-app-router");
  });
});

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

describe("main", () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.mocked(globSync).mockReturnValue([]);
    vi.mocked(fs.readFileSync).mockReturnValue("" as never);
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined as never);
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
      expect.stringContaining("Framework: next-app-router"),
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
});
