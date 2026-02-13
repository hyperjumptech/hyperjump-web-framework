/**
 * Template for the generated `form.action.ts` file.
 *
 * Produces a "use server" module that wraps the user-defined handler
 * with `createFormAction` for form-based server actions.
 */

import { GENERATED_HEADER } from "../../../constants.js";

export interface FormActionTemplateData {
  /** Relative import path to the config file (without extension), e.g. "../route.post.config" */
  configFileBase: string;
  /** Config file name, e.g. "route.post.config.ts" */
  configFileName: string;
}

export function formActionTemplate(d: FormActionTemplateData): string {
  return `${GENERATED_HEADER}
"use server";

import {
  handler,
  requestValidator,
  responseValidator,
} from "${d.configFileBase}";
import { createFormAction } from "route-action-gen/lib/next";

/**
 * The form action that executes the handler function in the \`${d.configFileName}\` file.
 *
 * @returns The form action.
 */
export const formAction = createFormAction(
  requestValidator,
  responseValidator,
  handler
);
`;
}
