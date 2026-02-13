/**
 * Template for the generated `route.ts` file (Pages Router).
 *
 * Produces a Next.js Pages Router API route handler that uses `createPagesRoute`
 * to dispatch to the correct method handler based on `req.method`.
 */

import { GENERATED_HEADER } from "../../../constants.js";

export interface PagesRouteEntry {
  /** HTTP method, e.g. "get" */
  method: string;
  /** Config file name without .ts extension, e.g. "route.get.config" */
  configFileBase: string;
}

export interface PagesRouteTemplateInput {
  /** All method entries to include in the route */
  entries: PagesRouteEntry[];
  /** Dynamic segment names from the route path, e.g. ["postId"] */
  paramNames: string[];
  /**
   * Relative path prefix from the generated directory to the config directory.
   * e.g. `"../"` when generated files are in `.generated/` inside the config dir,
   * or `"../../../../pages/api/users/"` when generated files are at project root.
   */
  configImportPrefix: string;
}

export function pagesRouteTemplate(input: PagesRouteTemplateInput): string {
  const { entries, paramNames, configImportPrefix } = input;

  // Build imports
  const configImports = entries.map(
    (e) =>
      `import {\n` +
      `  handler as ${e.method}Handler,\n` +
      `  requestValidator as ${e.method}RequestValidator,\n` +
      `  responseValidator as ${e.method}ResponseValidator,\n` +
      `} from "${configImportPrefix}${e.configFileBase}";`,
  );

  // Build method map entries
  const methodEntries = entries.map(
    (e) =>
      `    ${e.method}: {\n` +
      `      requestValidator: ${e.method}RequestValidator,\n` +
      `      responseValidator: ${e.method}ResponseValidator,\n` +
      `      handler: ${e.method}Handler,\n` +
      `    },`,
  );

  // Build param names array literal
  const paramNamesLiteral =
    paramNames.length > 0
      ? `[${paramNames.map((n) => `"${n}"`).join(", ")}]`
      : "[]";

  const lines = [
    GENERATED_HEADER,
    "",
    `import { createPagesRoute } from "route-action-gen/lib/next/pages";`,
    ...configImports,
    "",
    "/**",
    " * Next.js Pages Router API route handler.",
    " *",
    " * Dispatches to the correct method handler based on `req.method`.",
    " * Validates request body, params, headers, and search params before",
    " * calling the handler. Returns 405 for unsupported methods.",
    " */",
    `export default createPagesRoute(`,
    `  {`,
    ...methodEntries,
    `  },`,
    `  ${paramNamesLiteral},`,
    `);`,
    "",
  ];

  return lines.join("\n");
}
