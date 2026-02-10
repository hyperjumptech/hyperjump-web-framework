/**
 * Template for the generated `route.ts` file.
 *
 * Produces Next.js App Router route handlers (GET, POST, etc.) that delegate
 * to the user-defined handler functions in config files.
 */

import { GENERATED_HEADER } from "../../../constants.js";

export interface RouteEntry {
  /** HTTP method, e.g. "get" */
  method: string;
  /** Uppercased method, e.g. "GET" */
  methodUpper: string;
  /** Config file name without .ts extension, e.g. "route.get.config" */
  configFileBase: string;
}

export function routeTemplate(entries: RouteEntry[]): string {
  const imports = [
    `import { createRoute } from "route-action-gen/lib/next";`,
    ...entries.map(
      (e) =>
        `import {\n` +
        `  handler as ${e.method}Handler,\n` +
        `  requestValidator as ${e.method}RequestValidator,\n` +
        `  responseValidator as ${e.method}ResponseValidator,\n` +
        `} from "../${e.configFileBase}";`,
    ),
  ];

  const exports = entries.map(
    (e) =>
      `export const ${e.methodUpper} = createRoute(\n` +
      `  ${e.method}RequestValidator,\n` +
      `  ${e.method}ResponseValidator,\n` +
      `  ${e.method}Handler\n` +
      `);`,
  );

  return [GENERATED_HEADER, "", ...imports, "", ...exports, ""].join("\n");
}
