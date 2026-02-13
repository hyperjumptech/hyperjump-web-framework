/**
 * Shared types for the route-action-gen CLI.
 */

/** HTTP methods supported by route config files */
export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "options"
  | "head";

/** Methods that typically have a request body */
export const BODY_METHODS: HttpMethod[] = ["post", "put", "patch"];

/** Information about a single field in a Zod schema */
export interface FieldInfo {
  /** Field name, e.g. "title" */
  name: string;
  /** Zod type, e.g. "string", "number", "boolean" */
  zodType: string;
}

/** Parsed metadata from a single route config file */
export interface ParsedConfig {
  /** HTTP method, e.g. "get", "post" */
  method: HttpMethod;
  /** Config file name, e.g. "route.post.config.ts" */
  configFileName: string;
  /** Whether the config has a body validator */
  hasBody: boolean;
  /** Whether the config has a params validator */
  hasParams: boolean;
  /** Whether the config has a headers validator */
  hasHeaders: boolean;
  /** Whether the config has a searchParams validator */
  hasSearchParams: boolean;
  /** Whether the config has an auth/user function */
  hasAuth: boolean;
  /** Fields extracted from the body Zod schema */
  bodyFields: FieldInfo[];
  /** Fields extracted from the params Zod schema */
  paramFields: FieldInfo[];
  /** Fields extracted from the searchParams Zod schema */
  searchParamFields: FieldInfo[];
}

/** Context passed to a framework generator for a single directory */
export interface GenerationContext {
  /** Absolute directory path containing the config files */
  directory: string;
  /** URL route path, e.g. "/api/posts/[postId]" */
  routePath: string;
  /** Parsed config metadata, one per HTTP method */
  configs: ParsedConfig[];
  /**
   * Relative path prefix from the generated directory to the config directory,
   * used for import statements in generated files.
   *
   * - App Router: `"../"` (generated files are in `.generated/` inside the config dir)
   * - Pages Router: e.g. `"../../../../pages/api/users/"` (generated files are at project root)
   */
  configImportPrefix: string;
}

/** A single generated file */
export interface GeneratedFile {
  /** File name relative to the .generated/ directory, e.g. "route.ts" */
  fileName: string;
  /** File content */
  content: string;
}

/** Entry point file that re-exports from .generated/ */
export interface EntryPointFile {
  /** File name relative to the config directory, e.g. "route.ts" or "index.ts" */
  fileName: string;
  /** File content, e.g. 'export * from "./.generated/route";\n' */
  content: string;
}

/** Interface that all framework generators must implement */
export interface FrameworkGenerator {
  /** Framework name used for --framework flag, e.g. "next-app-router" */
  name: string;
  /**
   * Compute the route path from a config file's absolute directory path.
   * e.g. "/abs/path/app/api/posts/[postId]" -> "/api/posts/[postId]"
   */
  resolveRoutePath(directory: string): string;
  /**
   * Resolve the absolute path of the generated output directory.
   *
   * - App Router: `path.join(configDir, ".generated")` (inside the config dir)
   * - Pages Router: `path.join(cwd, ".generated", relative(cwd, configDir))` (at project root)
   *
   * @param configDir - Absolute path to the directory containing config files
   * @param cwd - Absolute path to the project working directory
   */
  resolveGeneratedDir(configDir: string, cwd: string): string;
  /**
   * Generate files for a single directory containing route configs.
   * @returns Array of files to write into the generated directory
   */
  generate(context: GenerationContext): GeneratedFile[];
  /**
   * Get the entry point file that re-exports from the generated directory.
   * This file lives in the config directory (not inside the generated dir).
   *
   * @param generatedDirRelPath - Relative path from the config directory to the generated directory
   *                              (e.g. "./.generated" for App Router, "../../../.generated/pages/api/users" for Pages Router)
   *
   * - App Router: route.ts with `export * from "./.generated/route";`
   * - Pages Router: index.ts with `export { default } from "{generatedDirRelPath}/route";`
   */
  getEntryPointFile(generatedDirRelPath: string): EntryPointFile;
}

/** Dependencies that can be injected for testing */
export interface CliDeps {
  globSync: (pattern: string, options?: { cwd?: string }) => string[];
  readFileSync: (path: string) => string;
  writeFileSync: (path: string, content: string) => void;
  mkdirSync: (path: string, options?: { recursive?: boolean }) => void;
  existsSync: (path: string) => boolean;
  cwd: () => string;
}
