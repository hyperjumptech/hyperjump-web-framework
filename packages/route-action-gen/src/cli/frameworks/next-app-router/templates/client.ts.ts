/**
 * Template for the generated `client.ts` file.
 *
 * Produces a `RouteClient` class with typed methods for each HTTP method,
 * usable from non-React environments.
 */

// ---------------------------------------------------------------------------
// Client method template
// ---------------------------------------------------------------------------

export interface ClientMethodData {
  /** HTTP method, e.g. "get" */
  method: string;
  /** Method prefix for validator references, e.g. "get" */
  prefix: string;
  /** Full parameter signature, e.g. "inputData: {\n    params: ...\n  }" or "" */
  inputType: string;
  /**
   * Code block for search params handling, placed after the method signature
   * opening brace. Empty string when there are no search params.
   * When present, starts with "\n" to create a blank line.
   */
  searchParamsCode: string;
  /** The fetch URL expression or variable name, e.g. "`/api/posts/${...}`" or "fetchURL" */
  fetchUrlVar: string;
  /** Pre-formatted fetch options lines, joined with newlines. */
  fetchOptions: string;
  /** "    return validatedData;" or "\n    return validatedData;" (with leading blank line for non-get) */
  returnBlock: string;
}

export function clientMethodTemplate(d: ClientMethodData): string {
  const lines = [
    `  /**`,
    `   * The ${d.method} method that can be used to call the route handler from a non-React app.`,
    `   */`,
    `  async ${d.method}(${d.inputType}): Promise<z.infer<typeof ${d.prefix}ResponseValidator>> {`,
  ];

  if (d.searchParamsCode) {
    lines.push(d.searchParamsCode);
  }

  lines.push(
    `    const response = await fetch(${d.fetchUrlVar}, {`,
    d.fetchOptions,
    `    });`,
    ``,
    `    if (!response.ok) {`,
    `      const errorBody = await response.json();`,
    `      throw new Error(errorBody.message ?? response.statusText);`,
    `    }`,
    ``,
    `    const responseData = await response.json();`,
    `    return responseData as z.infer<typeof ${d.prefix}ResponseValidator>;`,
    `  }`,
    ``,
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Client file template
// ---------------------------------------------------------------------------

export interface ClientTemplateData {
  /** Pre-built imports array (including GENERATED_HEADER as first element). */
  imports: string[];
  /** Pre-built method body strings (each from clientMethodTemplate). */
  methods: string[];
}

export function clientTemplate(d: ClientTemplateData): string {
  return [
    ...d.imports,
    "",
    "/**",
    " * The client class that can be used to call the route handler from a non-React app.",
    " *",
    " * @returns The client class.",
    " */",
    "export class RouteClient {",
    ...d.methods,
    "}",
    "",
  ].join("\n");
}
