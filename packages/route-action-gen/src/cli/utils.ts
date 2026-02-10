/**
 * Utility functions for the route-action-gen CLI.
 */

/**
 * Convert a kebab-case or snake_case string to PascalCase.
 * @example pascalCase("post-id") => "PostId"
 * @example pascalCase("foo_bar") => "FooBar"
 */
export function pascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Convert a kebab-case or snake_case string to camelCase.
 * @example camelCase("post-id") => "postId"
 * @example camelCase("foo_bar") => "fooBar"
 */
export function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Extract dynamic segment names from a route path.
 * @example extractDynamicSegments("/api/posts/[postId]") => ["postId"]
 * @example extractDynamicSegments("/api/[orgId]/posts/[postId]") => ["orgId", "postId"]
 */
export function extractDynamicSegments(routePath: string): string[] {
  const matches = routePath.match(/\[(\w+)\]/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1, -1));
}

/**
 * Convert a route path with dynamic segments into a fetch URL template literal expression.
 * @example buildFetchUrlExpression("/api/posts/[postId]", "inputData.params") => "`/api/posts/${inputData.params.postId}`"
 */
export function buildFetchUrlExpression(
  routePath: string,
  paramsAccessor: string,
): string {
  const url = routePath.replace(
    /\[(\w+)\]/g,
    (_, name) => `\${${paramsAccessor}.${name}}`,
  );
  return "`" + url + "`";
}

/**
 * Map a Zod type name to an HTML input type.
 */
export function zodTypeToInputType(zodType: string): string {
  switch (zodType) {
    case "number":
      return "number";
    case "boolean":
      return "checkbox";
    case "date":
      return "date";
    default:
      return "text";
  }
}

/**
 * Convert a field name to a human-readable label.
 * @example fieldNameToLabel("postId") => "Post Id"
 * @example fieldNameToLabel("firstName") => "First Name"
 */
export function fieldNameToLabel(name: string): string {
  // Split camelCase
  const words = name.replace(/([a-z])([A-Z])/g, "$1 $2");
  // Capitalize each word
  return words
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
