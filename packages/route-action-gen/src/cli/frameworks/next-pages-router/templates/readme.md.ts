/**
 * Template for the generated README.md file (Pages Router).
 *
 * Produces a markdown file describing every file in the .generated/ directory
 * for the Next.js Pages Router target.
 */

import { GENERATED_NOTICE } from "../../../constants.js";

export interface PagesReadmeTemplateInput {
  /** URL route path, e.g. "/api/posts/[postId]" */
  routePath: string;
  /** HTTP methods that have configs, e.g. ["get", "post"] */
  methods: string[];
  /** Whether form-components.tsx was generated */
  hasFormComponents: boolean;
}

export function pagesReadmeTemplate(input: PagesReadmeTemplateInput): string {
  const { routePath, methods, hasFormComponents } = input;

  const methodList = methods.map((m) => m.toUpperCase()).join(", ");

  const lines: string[] = [
    `<!-- ${GENERATED_NOTICE} -->`,
    ``,
    `# Generated files for \`${routePath}\``,
    ``,
    `> **Do not edit these files manually.** They are regenerated every time you run \`route-action-gen\`.`,
    ``,
    `This directory contains auto-generated TypeScript/React code for the **${methodList}** route handler${methods.length > 1 ? "s" : ""} (Next.js Pages Router).`,
    ``,
    `## Files`,
    ``,
    `### \`route.ts\``,
    ``,
    `Next.js Pages Router API route handler. Exports a default handler that dispatches to the correct method (${methodList}) based on \`req.method\`, validates incoming requests, delegates to your \`route.[method].config.ts\` handler, and returns a validated JSON response via \`res.json()\`.`,
    ``,
    `### \`client.ts\``,
    ``,
    `A \`RouteClient\` class for calling the route from **non-React** code (scripts, API utilities, server-side callers). Provides a typed method per HTTP method with automatic request/response validation via Zod.`,
    ``,
  ];

  // Per-method hook files
  for (const method of methods) {
    if (method === "get") {
      lines.push(
        `### \`use-route-get.tsx\``,
        ``,
        `React hook (\`useRouteGet\`) for fetching data from the GET endpoint. Manages loading, error, and data states with automatic refetching support.`,
        ``,
      );
    } else {
      lines.push(
        `### \`use-route-${method}.tsx\``,
        ``,
        `React hook (\`useRoute${capitalize(method)}\`) for calling the ${method.toUpperCase()} endpoint. Manages loading and error states, supports abort controllers and timeouts.`,
        ``,
      );
    }
  }

  if (hasFormComponents) {
    lines.push(
      `### \`form-components.tsx\``,
      ``,
      `Pre-built React \`<input>\` and \`<label>\` component factories for every field in the request body, params, and searchParams schemas. Useful for quickly scaffolding forms with the correct \`name\`, \`type\`, and \`id\` attributes.`,
      ``,
    );
  }

  return lines.join("\n");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
