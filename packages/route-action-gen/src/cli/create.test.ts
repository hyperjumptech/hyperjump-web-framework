import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getConfigTemplate,
  createConfigFile,
  isValidMethod,
} from "./create.js";
import type { CliDeps } from "./types.js";

// ---------------------------------------------------------------------------
// isValidMethod
// ---------------------------------------------------------------------------

describe("isValidMethod", () => {
  it("returns true for all valid HTTP methods", () => {
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
      expect(isValidMethod(method)).toBe(true);
    }
  });

  it("returns false for invalid strings", () => {
    expect(isValidMethod("foo")).toBe(false);
    expect(isValidMethod("GET")).toBe(false);
    expect(isValidMethod("")).toBe(false);
    expect(isValidMethod("connect")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getConfigTemplate
// ---------------------------------------------------------------------------

describe("getConfigTemplate", () => {
  it("generates a non-body template for GET", () => {
    // Act
    const template = getConfigTemplate("get");

    // Assert
    expect(template).toContain("createRequestValidator({})");
    expect(template).toContain("export const requestValidator");
    expect(template).toContain("export const responseValidator");
    expect(template).toContain("export const handler");
    expect(template).not.toContain("bodyValidator");
    expect(template).not.toContain("const { body }");
  });

  it("generates a non-body template for DELETE", () => {
    // Act
    const template = getConfigTemplate("delete");

    // Assert
    expect(template).not.toContain("bodyValidator");
    expect(template).toContain("export const handler");
  });

  it("generates a body template for POST", () => {
    // Act
    const template = getConfigTemplate("post");

    // Assert
    expect(template).toContain("const bodyValidator = z.object({})");
    expect(template).toContain("body: bodyValidator");
    expect(template).toContain("const { body } = data");
    expect(template).toContain("export const requestValidator");
    expect(template).toContain("export const responseValidator");
    expect(template).toContain("export const handler");
  });

  it("generates a body template for PUT", () => {
    // Act
    const template = getConfigTemplate("put");

    // Assert
    expect(template).toContain("bodyValidator");
    expect(template).toContain("const { body } = data");
  });

  it("generates a body template for PATCH", () => {
    // Act
    const template = getConfigTemplate("patch");

    // Assert
    expect(template).toContain("bodyValidator");
    expect(template).toContain("const { body } = data");
  });

  it("imports from route-action-gen/lib", () => {
    // Act
    const template = getConfigTemplate("get");

    // Assert
    expect(template).toContain('from "route-action-gen/lib"');
    expect(template).toContain("createRequestValidator");
    expect(template).toContain("HandlerFunc");
    expect(template).toContain("successResponse");
    expect(template).toContain("errorResponse");
  });

  it("imports zod", () => {
    // Act
    const template = getConfigTemplate("get");

    // Assert
    expect(template).toContain('import { z } from "zod"');
  });

  it("uses the correct HandlerFunc generic signature", () => {
    // Act
    const template = getConfigTemplate("get");

    // Assert
    expect(template).toContain("HandlerFunc<");
    expect(template).toContain("typeof requestValidator");
    expect(template).toContain("typeof responseValidator");
    expect(template).toContain("undefined");
  });
});

// ---------------------------------------------------------------------------
// createConfigFile
// ---------------------------------------------------------------------------

describe("createConfigFile", () => {
  let deps: Pick<CliDeps, "writeFileSync" | "mkdirSync" | "existsSync" | "cwd">;

  beforeEach(() => {
    deps = {
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      existsSync: vi.fn().mockReturnValue(false),
      cwd: vi.fn().mockReturnValue("/project"),
    };
  });

  it("creates a config file in the current directory", () => {
    // Act
    const result = createConfigFile(deps, "get", ".");

    // Assert
    expect(result.success).toBe(true);
    expect(result.filePath).toBe("/project/route.get.config.ts");
    expect(deps.mkdirSync).toHaveBeenCalledWith("/project", {
      recursive: true,
    });
    expect(deps.writeFileSync).toHaveBeenCalledWith(
      "/project/route.get.config.ts",
      expect.stringContaining("export const handler"),
    );
  });

  it("creates a config file in a relative directory", () => {
    // Act
    const result = createConfigFile(deps, "post", "./app/api/users");

    // Assert
    expect(result.success).toBe(true);
    expect(result.filePath).toBe("/project/app/api/users/route.post.config.ts");
    expect(deps.mkdirSync).toHaveBeenCalledWith("/project/app/api/users", {
      recursive: true,
    });
  });

  it("creates a config file in an absolute directory", () => {
    // Act
    const result = createConfigFile(deps, "delete", "/abs/path/api");

    // Assert
    expect(result.success).toBe(true);
    expect(result.filePath).toBe("/abs/path/api/route.delete.config.ts");
    expect(deps.mkdirSync).toHaveBeenCalledWith("/abs/path/api", {
      recursive: true,
    });
  });

  it("returns an error if the file already exists", () => {
    // Setup
    vi.mocked(deps.existsSync).mockReturnValue(true);

    // Act
    const result = createConfigFile(deps, "get", ".");

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain("File already exists");
    expect(result.error).toContain("--force");
    expect(deps.writeFileSync).not.toHaveBeenCalled();
  });

  it("overwrites existing file when force is true", () => {
    // Setup
    vi.mocked(deps.existsSync).mockReturnValue(true);

    // Act
    const result = createConfigFile(deps, "get", ".", true);

    // Assert
    expect(result.success).toBe(true);
    expect(result.filePath).toBe("/project/route.get.config.ts");
    expect(deps.writeFileSync).toHaveBeenCalled();
  });

  it("creates directory recursively", () => {
    // Act
    createConfigFile(deps, "get", "./deeply/nested/dir");

    // Assert
    expect(deps.mkdirSync).toHaveBeenCalledWith("/project/deeply/nested/dir", {
      recursive: true,
    });
  });

  it("writes body template for POST method", () => {
    // Act
    createConfigFile(deps, "post", ".");

    // Assert
    const writtenContent = vi.mocked(deps.writeFileSync).mock.calls[0][1];
    expect(writtenContent).toContain("bodyValidator");
    expect(writtenContent).toContain("const { body } = data");
  });

  it("writes non-body template for GET method", () => {
    // Act
    createConfigFile(deps, "get", ".");

    // Assert
    const writtenContent = vi.mocked(deps.writeFileSync).mock.calls[0][1];
    expect(writtenContent).not.toContain("bodyValidator");
  });
});
