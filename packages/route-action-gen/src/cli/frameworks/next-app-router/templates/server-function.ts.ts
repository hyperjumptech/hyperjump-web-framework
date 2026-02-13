/**
 * Template for the generated `server.function.ts` file.
 *
 * Produces a "use server" module that wraps the user-defined handler
 * with `createServerFunction` for server-side execution.
 */

import { GENERATED_HEADER } from "../../../constants.js";

export interface ServerFunctionTemplateData {
  /** Relative import path to the config file (without extension), e.g. "../route.post.config" */
  configFileBase: string;
  /** Config file name, e.g. "route.post.config.ts" */
  configFileName: string;
}

export function serverFunctionTemplate(d: ServerFunctionTemplateData): string {
  return `${GENERATED_HEADER}
"use server";

import {
  handler,
  requestValidator,
  responseValidator,
} from "${d.configFileBase}";
import { createServerFunction } from "route-action-gen/lib/next";

/**
 * The server function that executes the handler function in the \`${d.configFileName}\` file.
 *
 * @returns The server function.
 */
export const serverFunction = createServerFunction(
  requestValidator,
  responseValidator,
  handler
);
`;
}
