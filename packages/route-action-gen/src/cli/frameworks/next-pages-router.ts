/**
 * Next.js Pages Router framework generator.
 *
 * Generates files for:
 * - route.ts (Default export API route handler using createPagesRoute)
 * - client.ts (RouteClient class for non-React usage)
 * - use-route-[method].tsx (React hooks per method)
 * - form-components.tsx (React form input/label components)
 *
 * Does NOT generate (App Router only):
 * - server.function.ts
 * - form.action.ts
 * - use-server-function.tsx
 * - use-form-action.tsx
 */

import path from "node:path";
import type {
  FrameworkGenerator,
  GenerationContext,
  GeneratedFile,
  EntryPointFile,
  ParsedConfig,
} from "../types.js";
import { BODY_METHODS } from "../types.js";
import {
  pascalCase,
  buildFetchUrlExpression,
  extractDynamicSegments,
  zodTypeToInputType,
  fieldNameToLabel,
} from "../utils.js";
import { GENERATED_HEADER } from "../constants.js";

// Pages Router-specific templates
import { pagesRouteTemplate } from "./next-pages-router/templates/route.ts.js";
import { pagesReadmeTemplate } from "./next-pages-router/templates/readme.md.js";

// Shared templates (reused from App Router)
import {
  clientTemplate,
  clientMethodTemplate,
} from "./next-app-router/templates/client.ts.js";
import { useRouteGetTemplate } from "./next-app-router/templates/use-route-get.tsx.js";
import { useRouteMutationTemplate } from "./next-app-router/templates/use-route-mutation.tsx.js";
import { formComponentsTemplate } from "./next-app-router/templates/form-components.tsx.js";

export class NextPagesRouterGenerator implements FrameworkGenerator {
  name = "next-pages-router";

  resolveGeneratedDir(configDir: string, cwd: string): string {
    const relativeConfigPath = path.relative(cwd, configDir);
    return path.join(cwd, ".generated", relativeConfigPath);
  }

  getEntryPointFile(generatedDirRelPath: string): EntryPointFile {
    return {
      fileName: "index.ts",
      content: `export { default } from "${generatedDirRelPath}/route";\n`,
    };
  }

  resolveRoutePath(directory: string): string {
    // Find the 'pages/' segment in the path and use everything after it
    const pagesIndex = directory.indexOf("/pages/");
    if (pagesIndex !== -1) {
      return directory.slice(pagesIndex + "/pages".length);
    }
    // Fallback: use the last path segment
    const parts = directory.split("/");
    return "/" + parts[parts.length - 1];
  }

  generate(context: GenerationContext): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const { configs, routePath, configImportPrefix } = context;

    // Always generate route.ts and client.ts
    files.push(this.generateRoute(configs, routePath, configImportPrefix));
    files.push(this.generateClient(configs, routePath, configImportPrefix));

    // Generate use-route-[method].tsx for each method
    for (const config of configs) {
      files.push(
        this.generateUseRouteHook(config, routePath, configImportPrefix),
      );
    }

    // Find body methods (POST, PUT, PATCH) for form components generation
    const bodyConfigs = configs.filter((c) => BODY_METHODS.includes(c.method));

    let hasFormComponents = false;

    if (bodyConfigs.length > 0) {
      // Generate form-components if there are body or param fields
      const primaryBodyConfig = bodyConfigs[0]!;
      const allBodyFields = bodyConfigs.flatMap((c) => c.bodyFields);
      const allParamFields = bodyConfigs.flatMap((c) => c.paramFields);
      if (allBodyFields.length > 0 || allParamFields.length > 0) {
        files.push(this.generateFormComponents(primaryBodyConfig));
        hasFormComponents = true;
      }
    }

    // Always generate README.md as the last file
    files.push(this.generateReadme(routePath, configs, hasFormComponents));

    return files;
  }

  // ---------------------------------------------------------------------------
  // route.ts (Pages Router — default export with createPagesRoute)
  // ---------------------------------------------------------------------------
  private generateRoute(
    configs: ParsedConfig[],
    routePath: string,
    configImportPrefix: string,
  ): GeneratedFile {
    const entries = configs.map((config) => ({
      method: config.method,
      configFileBase: config.configFileName.replace(".ts", ""),
    }));

    const paramNames = extractDynamicSegments(routePath);

    return {
      fileName: "route.ts",
      content: pagesRouteTemplate({ entries, paramNames, configImportPrefix }),
    };
  }

  // ---------------------------------------------------------------------------
  // client.ts (reuses App Router template — framework-agnostic)
  // ---------------------------------------------------------------------------
  private generateClient(
    configs: ParsedConfig[],
    routePath: string,
    configImportPrefix: string,
  ): GeneratedFile {
    // Build imports
    const imports: string[] = [GENERATED_HEADER];
    for (const config of configs) {
      const prefix = config.method;
      imports.push(
        `import type {\n` +
          `  requestValidator as ${prefix}RequestValidator,\n` +
          `  responseValidator as ${prefix}ResponseValidator,\n` +
          `} from "${configImportPrefix}${config.configFileName.replace(".ts", "")}";`,
      );
    }
    imports.push(`import { z } from "zod";`);

    // Build methods
    const methods: string[] = [];
    for (const config of configs) {
      methods.push(this.prepareClientMethod(config, routePath));
    }

    return {
      fileName: "client.ts",
      content: clientTemplate({ imports, methods }),
    };
  }

  private prepareClientMethod(config: ParsedConfig, routePath: string): string {
    const prefix = config.method;
    const isBodyMethod = BODY_METHODS.includes(config.method);

    // Build input type
    const inputFields: string[] = [];
    if (isBodyMethod && config.hasBody) {
      inputFields.push(
        `    body: z.infer<NonNullable<(typeof ${prefix}RequestValidator)["body"]>>;`,
      );
    }
    if (config.hasParams) {
      inputFields.push(
        `    params: z.infer<NonNullable<(typeof ${prefix}RequestValidator)["params"]>>;`,
      );
    }
    if (config.hasSearchParams) {
      inputFields.push(
        `    searchParams: z.infer<NonNullable<(typeof ${prefix}RequestValidator)["searchParams"]>>;`,
      );
    }

    const inputType =
      inputFields.length > 0
        ? `inputData: {\n${inputFields.join("\n")}\n  }`
        : "";

    // Build fetch URL
    const fetchUrl = buildFetchUrlExpression(routePath, "inputData.params");

    // Build search params code
    let searchParamsCode = "";
    if (config.hasSearchParams) {
      searchParamsCode = `\n    const searchParams = new URLSearchParams(inputData.searchParams).toString();\n    const fetchURL = ${fetchUrl.slice(0, -1)}?\${searchParams}\`;`;
    }

    // Build fetch options
    const fetchOptions: string[] = [`      method: "${config.method}",`];
    if (isBodyMethod) {
      fetchOptions.push(`      credentials: "include",`);
      if (config.hasBody) {
        fetchOptions.push(`      body: JSON.stringify(inputData.body),`);
        fetchOptions.push(
          `      headers: {\n        "Content-Type": "application/json",\n      },`,
        );
      }
    }

    const fetchUrlVar = config.hasSearchParams ? "fetchURL" : fetchUrl;
    const returnBlock =
      config.method === "get"
        ? `    return validatedData;`
        : `\n    return validatedData;`;

    return clientMethodTemplate({
      method: config.method,
      prefix,
      inputType,
      searchParamsCode,
      fetchUrlVar,
      fetchOptions: fetchOptions.join("\n"),
      returnBlock,
    });
  }

  // ---------------------------------------------------------------------------
  // use-route-[method].tsx (reuses App Router templates — framework-agnostic)
  // ---------------------------------------------------------------------------
  private generateUseRouteHook(
    config: ParsedConfig,
    routePath: string,
    configImportPrefix: string,
  ): GeneratedFile {
    if (config.method === "get") {
      return this.generateUseRouteGetHook(
        config,
        routePath,
        configImportPrefix,
      );
    }
    return this.generateUseRouteMutationHook(
      config,
      routePath,
      configImportPrefix,
    );
  }

  private generateUseRouteGetHook(
    config: ParsedConfig,
    routePath: string,
    configImportPrefix: string,
  ): GeneratedFile {
    const configFileBase = `${configImportPrefix}${config.configFileName.replace(".ts", "")}`;
    const dynamicSegments = extractDynamicSegments(routePath);

    // Build input type fields
    const inputFields: string[] = [];
    if (config.hasParams) {
      inputFields.push(
        `  params: z.infer<NonNullable<typeof requestValidator.params>>;`,
      );
    }
    if (config.hasSearchParams) {
      inputFields.push(
        `  searchParams: z.infer<NonNullable<typeof requestValidator.searchParams>>;`,
      );
    }
    const inputType =
      inputFields.length > 0 ? `input: {\n${inputFields.join("\n")}\n}` : "";

    // Build the fetch URL construction line
    const baseUrl = routePath.replace(
      /\[(\w+)\]/g,
      (_, name) => `\${input.params.${name}}`,
    );
    const fetchUrlCode = config.hasSearchParams
      ? `      const fetchURL = \`\${url}${baseUrl}?\${searchParamsString}\`;`
      : `      const fetchURL = \`\${url}${baseUrl}\`;`;

    // Build searchParams line
    const searchParamsLine = config.hasSearchParams
      ? `\n  const searchParamsString = new URLSearchParams(input.searchParams).toString();\n`
      : "";

    // Build useEffect dependency array
    const effectDeps: string[] = [];
    for (const seg of dynamicSegments) {
      effectDeps.push(`input.params.${seg}`);
    }
    if (config.hasSearchParams) {
      effectDeps.push("searchParamsString");
    }
    effectDeps.push("lastFetchedAt");

    return {
      fileName: "use-route-get.tsx",
      content: useRouteGetTemplate({
        configFileBase,
        configFileName: config.configFileName,
        inputType,
        searchParamsLine,
        fetchUrlCode,
        effectDeps: effectDeps.join(", "),
      }),
    };
  }

  private generateUseRouteMutationHook(
    config: ParsedConfig,
    routePath: string,
    configImportPrefix: string,
  ): GeneratedFile {
    const method = config.method;
    const configFileBase = `${configImportPrefix}${config.configFileName.replace(".ts", "")}`;

    // Build input fields for the fetchData function parameter
    const inputFields: string[] = [];
    if (config.hasParams) {
      inputFields.push(
        `        params: z.infer<NonNullable<typeof requestValidator.params>>;`,
      );
    }
    if (config.hasBody) {
      inputFields.push(
        `        body: z.infer<NonNullable<typeof requestValidator.body>>;`,
      );
    }
    if (config.hasSearchParams) {
      inputFields.push(
        `        searchParams?: z.infer<NonNullable<typeof requestValidator.searchParams>>;`,
      );
    }
    inputFields.push(
      `        options?: { abortController?: AbortController; timeoutMs?: number };`,
    );

    // Build the fetch URL
    const dynamicSegments = extractDynamicSegments(routePath);
    let paramExtraction = "";
    if (dynamicSegments.length > 0 && config.hasParams) {
      const destructured = dynamicSegments.join(", ");
      paramExtraction = `      const { ${destructured} } = params;\n`;
    }

    const fetchUrlExpr = routePath.replace(
      /\[(\w+)\]/g,
      (_, name) => `\${${name}}`,
    );

    // Build fetch options
    const fetchOpts: string[] = [
      `          signal: combinedSignal,`,
      `          method: "${method}",`,
    ];
    if (BODY_METHODS.includes(method)) {
      fetchOpts.push(`          credentials: "include",`);
      if (config.hasBody) {
        fetchOpts.push(`          body: JSON.stringify(body),`);
        fetchOpts.push(
          `          headers: {\n            "Content-Type": "application/json",\n          },`,
        );
      }
    }

    // Build destructuring from inputData
    const destructParts: string[] = [];
    if (config.hasParams) destructParts.push("params");
    if (config.hasBody) destructParts.push("body");
    destructParts.push("options");

    return {
      fileName: `use-route-${method}.tsx`,
      content: useRouteMutationTemplate({
        configFileBase,
        configFileName: config.configFileName,
        method,
        methodPascal: pascalCase(method),
        inputFields: inputFields.join("\n"),
        destructParts: destructParts.join(", "),
        paramExtraction,
        fetchUrlExpr,
        fetchOpts: fetchOpts.join("\n"),
      }),
    };
  }

  // ---------------------------------------------------------------------------
  // form-components.tsx (reuses App Router template — framework-agnostic)
  // ---------------------------------------------------------------------------
  private generateFormComponents(config: ParsedConfig): GeneratedFile {
    const fields: string[] = [];

    // Body fields
    for (const field of config.bodyFields) {
      const name = `body.${field.name}`;
      const inputType = zodTypeToInputType(field.zodType);
      const label = fieldNameToLabel(field.name);

      fields.push(
        `  "${name}": {\n` +
          `    input: createInput({\n` +
          `      name: "${name}",\n` +
          `      type: "${inputType}",\n` +
          `      id: "${name}",\n` +
          `    }),\n` +
          `    label: createLabel({ id: "${name}", placeholderChildren: "${label}" }),\n` +
          `  },`,
      );
    }

    // Param fields
    for (const field of config.paramFields) {
      const name = `params.${field.name}`;
      const inputType = zodTypeToInputType(field.zodType);
      const label = fieldNameToLabel(field.name);

      const extraProps =
        field.zodType === "string" ? `\n      minLength: 1,` : "";

      fields.push(
        `  "${name}": {\n` +
          `    input: createInput({\n` +
          `      name: "${name}",\n` +
          `      type: "${inputType}",\n` +
          `      id: "${name}",${extraProps}\n` +
          `    }),\n` +
          `    label: createLabel({ id: "${name}", placeholderChildren: "${label}" }),\n` +
          `  },`,
      );
    }

    // SearchParams fields
    for (const field of config.searchParamFields) {
      const name = `searchParams.${field.name}`;
      const inputType = zodTypeToInputType(field.zodType);
      const label = fieldNameToLabel(field.name);

      fields.push(
        `  "${name}": {\n` +
          `    input: createInput({\n` +
          `      name: "${name}",\n` +
          `      type: "${inputType}",\n` +
          `      id: "${name}",\n` +
          `    }),\n` +
          `    label: createLabel({ id: "${name}", placeholderChildren: "${label}" }),\n` +
          `  },`,
      );
    }

    return {
      fileName: "form-components.tsx",
      content: formComponentsTemplate({ fields: fields.join("\n") }),
    };
  }

  // ---------------------------------------------------------------------------
  // README.md (Pages Router-specific)
  // ---------------------------------------------------------------------------
  private generateReadme(
    routePath: string,
    configs: ParsedConfig[],
    hasFormComponents: boolean,
  ): GeneratedFile {
    return {
      fileName: "README.md",
      content: pagesReadmeTemplate({
        routePath,
        methods: configs.map((c) => c.method),
        hasFormComponents,
      }),
    };
  }
}
