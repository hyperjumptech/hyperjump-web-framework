/**
 * Template for the generated `route.ts` file.
 *
 * Produces Next.js App Router route handlers (GET, POST, etc.) that delegate
 * to the user-defined handler functions in config files.
 */

import { GENERATED_HEADER } from "../../../constants.js";

export interface FieldEntry {
  name: string;
  zodType: string;
}

export interface RouteEntry {
  /** HTTP method, e.g. "get" */
  method: string;
  /** Uppercased method, e.g. "GET" */
  methodUpper: string;
  /** PascalCase method, e.g. "Get" */
  methodPascal: string;
  /** Relative import path to the config file (without extension), e.g. "../route.get.config" */
  configFileBase: string;
  /** URL route path, e.g. "/api/posts/[postId]" */
  routePath: string;
  /** Whether this is a body method (POST, PUT, PATCH) */
  isBodyMethod: boolean;
  /** Fields extracted from the body Zod schema */
  bodyFields: FieldEntry[];
  /** Fields extracted from the params Zod schema */
  paramFields: FieldEntry[];
  /** Fields extracted from the searchParams Zod schema */
  searchParamFields: FieldEntry[];
}

/**
 * Generate an example placeholder value for a Zod type.
 */
function exampleValue(zodType: string, fieldName: string): string {
  switch (zodType) {
    case "number":
      return "1";
    case "boolean":
      return "true";
    default:
      return `"example-${fieldName}"`;
  }
}

/**
 * Build example object literal entries, e.g. `title: "example-title", content: "example-content"`.
 */
function exampleObject(fields: FieldEntry[]): string {
  return fields
    .map((f) => `${f.name}: ${exampleValue(f.zodType, f.name)}`)
    .join(", ");
}

/**
 * Generate a JSDoc comment for a route handler export.
 */
function buildJsDoc(entry: RouteEntry): string {
  const { methodUpper, method, methodPascal, routePath } = entry;

  // Build example fetch URL by replacing [param] with concrete values
  const exampleFetchUrl = routePath.replace(/\[(\w+)\]/g, (_, name) => {
    const param = entry.paramFields.find((f) => f.name === name);
    const raw = param ? exampleValue(param.zodType, name) : name;
    return raw.replace(/"/g, "");
  });

  const lines: string[] = [];
  lines.push(`/**`);
  lines.push(
    ` * The ${methodUpper} route handler for the ${routePath} endpoint.`,
  );

  // --- fetch example ---
  lines.push(
    ` * You can call this route handler from a non-React app by using the \`fetch\` function:`,
  );
  lines.push(` * \`\`\`ts`);
  if (entry.isBodyMethod && entry.bodyFields.length > 0) {
    lines.push(` * const response = await fetch("${exampleFetchUrl}", {`);
    lines.push(` *   method: "${methodUpper}",`);
    lines.push(
      ` *   body: JSON.stringify({ ${exampleObject(entry.bodyFields)} }),`,
    );
    lines.push(` * });`);
  } else {
    lines.push(` * const response = await fetch("${exampleFetchUrl}", {`);
    lines.push(` *   method: "${methodUpper}",`);
    lines.push(` * });`);
  }
  lines.push(` * \`\`\``);

  // --- hook example ---
  const hookName = `useRoute${methodPascal}`;
  const hookArgs: string[] = [];
  if (entry.isBodyMethod && entry.bodyFields.length > 0) {
    hookArgs.push(`body: { ${exampleObject(entry.bodyFields)} }`);
  }
  if (entry.paramFields.length > 0) {
    hookArgs.push(`params: { ${exampleObject(entry.paramFields)} }`);
  }
  if (entry.searchParamFields.length > 0) {
    hookArgs.push(
      `searchParams: { ${exampleObject(entry.searchParamFields)} }`,
    );
  }

  lines.push(
    ` * Or you can use the \`${hookName}\` hook to call this route handler from a React client component:`,
  );
  lines.push(` * \`\`\`tsx`);
  if (hookArgs.length > 0) {
    lines.push(
      ` * const { data, error, isLoading, cancel, refetch, lastFetchedAt } = ${hookName}({`,
    );
    for (const arg of hookArgs) {
      lines.push(` *   ${arg},`);
    }
    lines.push(` * });`);
  } else {
    lines.push(
      ` * const { data, error, isLoading, cancel, refetch, lastFetchedAt } = ${hookName}();`,
    );
  }
  lines.push(` * \`\`\``);

  // --- RouteClient example ---
  lines.push(
    ` * Or you can use the \`RouteClient\` class to call this route handler from a non-React app:`,
  );
  lines.push(` * \`\`\`ts`);
  lines.push(` * const client = new RouteClient();`);
  if (hookArgs.length > 0) {
    lines.push(` * const response = await client.${method}({`);
    for (const arg of hookArgs) {
      lines.push(` *   ${arg},`);
    }
    lines.push(` * });`);
  } else {
    lines.push(` * const response = await client.${method}();`);
  }
  lines.push(` * \`\`\``);

  lines.push(` * @param inputData - The input data for the route handler.`);
  lines.push(` * @returns The response from the route handler.`);
  lines.push(` */`);

  return lines.join("\n");
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
        `} from "${e.configFileBase}";`,
    ),
  ];

  const exports = entries.map(
    (e) =>
      `${buildJsDoc(e)}\n` +
      `export const ${e.methodUpper} = createRoute(\n` +
      `  ${e.method}RequestValidator,\n` +
      `  ${e.method}ResponseValidator,\n` +
      `  ${e.method}Handler,\n` +
      `);`,
  );

  return (
    [GENERATED_HEADER, "", ...imports].join("\n") +
    "\n\n" +
    exports.join("\n\n") +
    "\n"
  );
}
