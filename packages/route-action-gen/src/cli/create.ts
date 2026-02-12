/**
 * Create module: scaffolds a new route config file with all required exports.
 */

import path from "node:path";
import type { HttpMethod, CliDeps } from "./types.js";
import { BODY_METHODS } from "./types.js";

/** Valid HTTP methods that can be used with `create` */
const VALID_METHODS = new Set<string>([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
]);

/**
 * Check whether a string is a valid HTTP method for config files.
 */
export function isValidMethod(value: string): value is HttpMethod {
  return VALID_METHODS.has(value);
}

/**
 * Generate the template content for a route config file.
 *
 * Body methods (post, put, patch) include a `bodyValidator` placeholder.
 * Non-body methods (get, delete, options, head) omit the body section.
 */
export function getConfigTemplate(method: HttpMethod): string {
  const hasBody = BODY_METHODS.includes(method);

  if (hasBody) {
    return `import { z } from "zod";
import {
  createRequestValidator,
  HandlerFunc,
  successResponse,
  errorResponse,
} from "route-action-gen/lib";

const bodyValidator = z.object({});

export const requestValidator = createRequestValidator({
  body: bodyValidator,
});

export const responseValidator = z.object({});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  const { body } = data;
  return successResponse({});
};
`;
  }

  return `import { z } from "zod";
import {
  createRequestValidator,
  HandlerFunc,
  successResponse,
  errorResponse,
} from "route-action-gen/lib";

export const requestValidator = createRequestValidator({});

export const responseValidator = z.object({});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  return successResponse({});
};
`;
}

/**
 * Create a route config file on disk.
 *
 * @param deps - Injected dependencies for testability
 * @param method - HTTP method (get, post, etc.)
 * @param directory - Target directory (absolute or relative to cwd)
 * @param force - If true, overwrite an existing file
 * @returns Result with the created file path or an error
 */
export function createConfigFile(
  deps: Pick<CliDeps, "writeFileSync" | "mkdirSync" | "existsSync" | "cwd">,
  method: HttpMethod,
  directory: string,
  force: boolean = false,
): { success: boolean; filePath?: string; error?: string } {
  const resolvedDir = path.isAbsolute(directory)
    ? directory
    : path.resolve(deps.cwd(), directory);

  const fileName = `route.${method}.config.ts`;
  const filePath = path.join(resolvedDir, fileName);

  // Check if file already exists
  if (!force && deps.existsSync(filePath)) {
    return {
      success: false,
      error: `File already exists: ${filePath}. Use --force to overwrite.`,
    };
  }

  // Ensure directory exists
  deps.mkdirSync(resolvedDir, { recursive: true });

  // Write the template
  const content = getConfigTemplate(method);
  deps.writeFileSync(filePath, content);

  return { success: true, filePath };
}
