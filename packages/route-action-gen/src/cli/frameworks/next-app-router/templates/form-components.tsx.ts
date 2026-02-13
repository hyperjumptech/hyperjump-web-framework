/**
 * Template for the generated `form-components.tsx` file.
 *
 * Produces a "use client" module with pre-built `<input>` and `<label>`
 * React components for each field in the request body, params, and searchParams.
 */

import { GENERATED_HEADER } from "../../../constants.js";

export interface FormComponentsTemplateData {
  /** Pre-formatted field entries, joined with newlines. */
  fields: string;
}

export function formComponentsTemplate(d: FormComponentsTemplateData): string {
  return `${GENERATED_HEADER}
"use client";
import { createInput, createLabel } from "route-action-gen/lib/react";

/**
 * The form components. The key is the name of the input field. The value is an object with the \`input\` and \`label\` components.
 * - \`input\` is the input React component and
 * - \`label\` is the label React component.
 *
 */
export const formComponents = {
${d.fields}
};
`;
}
