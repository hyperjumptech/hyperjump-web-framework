/**
 * Template for the generated README.md file.
 *
 * Produces a markdown file describing every file in the .generated/ directory.
 */

import { GENERATED_NOTICE } from "../../../constants.js";

export interface ReadmeTemplateInput {
  /** URL route path, e.g. "/api/posts/[postId]" */
  routePath: string;
  /** HTTP methods that have configs, e.g. ["get", "post"] */
  methods: string[];
  /** Whether body-method files (server function, form action, etc.) were generated */
  hasBodyMethods: boolean;
  /** Whether form-components.tsx was generated */
  hasFormComponents: boolean;
}

export function readmeTemplate(input: ReadmeTemplateInput): string {
  const { routePath, methods, hasBodyMethods, hasFormComponents } = input;

  const methodList = methods.map((m) => m.toUpperCase()).join(", ");

  const lines: string[] = [
    `<!-- ${GENERATED_NOTICE} -->`,
    ``,
    `# Generated files for \`${routePath}\``,
    ``,
    `> **Do not edit these files manually.** They are regenerated every time you run \`route-action-gen\`.`,
    ``,
    `This directory contains auto-generated TypeScript/React code for the **${methodList}** route handler${methods.length > 1 ? "s" : ""}.`,
    ``,
    `## Files`,
    ``,
    `### \`route.ts\``,
    ``,
    `Next.js App Router route handler. Exports a named handler for each HTTP method (${methodList}) that validates incoming requests, delegates to your \`route.[method].config.ts\` handler, and returns a validated JSON response.`,
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

  if (hasBodyMethods) {
    lines.push(
      `### \`server.function.ts\``,
      ``,
      `A \`"use server"\` wrapper around the route handler. Lets you call the mutation from React Server Components or via \`useServerFunction\` without going through HTTP.`,
      ``,
      `### \`form.action.ts\``,
      ``,
      `A \`"use server"\` form action that parses \`FormData\`, validates it, and calls the handler. Use with \`<form action={…}>\` or the \`useFormAction\` hook.`,
      ``,
      `### \`use-server-function.tsx\``,
      ``,
      `React hook (\`useServerFunction\`) that wraps \`server.function.ts\` in a \`useTransition\`, giving you \`isPending\` and \`execute()\` for ergonomic server-function calls from client components.`,
      ``,
      `### \`use-form-action.tsx\``,
      ``,
      `React hook (\`useFormAction\`) built on \`useActionState\`. Returns the current form state, a bound action to pass to \`<form action={…}>\`, and \`isPending\`.`,
      ``,
    );
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
