import { describe, it, expect } from "vitest";
import {
  generateServerActions,
  pascalCase,
  camelCase,
  getExportNames,
  findHandlerValidatorRoles,
} from "./cli/index";

const validConfig = `
export const addAdminHandler = async () => {};
export const addAdminValidator = {};
export const roles = ["admin"];
`;
const missingHandler = `
export const addAdminValidator = {};
export const roles = ["admin"];
`;
const missingValidator = `
export const addAdminHandler = async () => {};
export const roles = ["admin"];
`;
const missingRoles = `
export const addAdminHandler = async () => {};
export const addAdminValidator = {};
`;

describe("generateServerActions", () => {
  it("generates correct files for a valid config file", () => {
    const files: Record<string, string> = {};
    const deps = {
      globSync: () => ["/foo/add-admin.action-config.ts"],
      readFileSync: (_file: string) => validConfig,
      writeFileSync: (file: string, content: string) => {
        files[file] = content;
      },
      cwd: () => "/foo",
      now: () => new Date("2024-01-01T00:00:00Z"),
    };
    const result = generateServerActions(deps);
    expect(result.success).toBe(true);
    const creatorFile = "/foo/add-admin.action-creator.ts";
    const actionFile = "/foo/add-admin.action.ts";
    expect(files[creatorFile]).toContain("addAdminHandler");
    expect(files[actionFile]).toContain("addAdminFormAction");
    expect(result).toEqual({
      success: true,
      generated: [{ creatorFile, actionFile }],
    });
  });

  it("returns error if no config files found", () => {
    const deps = {
      globSync: () => [],
      readFileSync: () => "",
      writeFileSync: () => {},
      cwd: () => "/foo",
      now: () => new Date(),
    };
    const result = generateServerActions(deps);
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      error: expect.stringContaining("No .action-config.ts files found."),
    });
  });

  it("returns error if handler export is missing", () => {
    const deps = {
      globSync: () => ["/foo/add-admin.action-config.ts"],
      readFileSync: () => missingHandler,
      writeFileSync: () => {},
      cwd: () => "/foo",
      now: () => new Date(),
    };
    const result = generateServerActions(deps);
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      error: expect.stringContaining("missing addAdminHandler export"),
    });
  });

  it("returns error if validator export is missing", () => {
    const deps = {
      globSync: () => ["/foo/add-admin.action-config.ts"],
      readFileSync: () => missingValidator,
      writeFileSync: () => {},
      cwd: () => "/foo",
      now: () => new Date(),
    };
    const result = generateServerActions(deps);
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      error: expect.stringContaining("missing addAdminValidator export"),
    });
  });

  it("returns error if roles export is missing", () => {
    const deps = {
      globSync: () => ["/foo/add-admin.action-config.ts"],
      readFileSync: () => missingRoles,
      writeFileSync: () => {},
      cwd: () => "/foo",
      now: () => new Date(),
    };
    const result = generateServerActions(deps);
    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      error: expect.stringContaining("missing roles export"),
    });
  });

  it("handles multiple config files", () => {
    const files: Record<string, string> = {};
    const deps = {
      globSync: () => [
        "/foo/add-admin.action-config.ts",
        "/foo/delete-admin.action-config.ts",
      ],
      readFileSync: (_file: string) => validConfig,
      writeFileSync: (file: string, content: string) => {
        files[file] = content;
      },
      cwd: () => "/foo",
      now: () => new Date("2024-01-01T00:00:00Z"),
    };
    const result = generateServerActions(deps);
    expect(result.success).toBe(true);
    expect(Object.keys(files)).toContain("/foo/add-admin.action-creator.ts");
    expect(Object.keys(files)).toContain("/foo/delete-admin.action-creator.ts");
    expect(result).toEqual({
      success: true,
      generated: [
        {
          creatorFile: "/foo/add-admin.action-creator.ts",
          actionFile: "/foo/add-admin.action.ts",
        },
        {
          creatorFile: "/foo/delete-admin.action-creator.ts",
          actionFile: "/foo/delete-admin.action.ts",
        },
      ],
    });
  });
});

describe("utility functions", () => {
  it("pascalCase works", () => {
    expect(pascalCase("add-admin")).toBe("AddAdmin");
    expect(pascalCase("foo_bar")).toBe("FooBar");
  });
  it("camelCase works", () => {
    expect(camelCase("add-admin")).toBe("addAdmin");
    expect(camelCase("foo_bar")).toBe("fooBar");
  });
  it("getExportNames works", () => {
    const code = `export const foo = 1; export const bar = 2;`;
    expect(getExportNames(code)).toEqual(["foo", "bar"]);
  });
  it("findHandlerValidatorRoles works", () => {
    expect(
      findHandlerValidatorRoles(["fooHandler", "fooValidator", "roles"]),
    ).toEqual({
      handler: "fooHandler",
      validator: "fooValidator",
      roles: "roles",
    });
    expect(findHandlerValidatorRoles(["roles"])).toEqual({
      handler: null,
      validator: null,
      roles: "roles",
    });
  });
});
