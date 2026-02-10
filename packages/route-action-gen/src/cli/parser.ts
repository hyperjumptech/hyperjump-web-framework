/**
 * Config file parser: extracts metadata from route config files using regex.
 *
 * Parses the TypeScript source text to determine:
 * - Which validators are present (body, params, headers, searchParams, user)
 * - Field names and Zod types from z.object({...}) definitions
 */

import type { HttpMethod, ParsedConfig, FieldInfo } from "./types.js";

/**
 * Parse a route config file and extract metadata.
 *
 * @param fileContent - The TypeScript source text of the config file
 * @param method - The HTTP method (extracted from the file name)
 * @param configFileName - The config file name, e.g. "route.post.config.ts"
 * @returns Parsed config metadata
 */
export function parseConfigFile(
  fileContent: string,
  method: HttpMethod,
  configFileName: string,
): ParsedConfig {
  // Find the createRequestValidator call and its arguments
  const validatorProps = extractValidatorProperties(fileContent);

  // Extract field info for body, params, searchParams
  const bodyFields = validatorProps.bodyVarName
    ? extractZodObjectFields(fileContent, validatorProps.bodyVarName)
    : [];
  const paramFields = validatorProps.paramsVarName
    ? extractZodObjectFields(fileContent, validatorProps.paramsVarName)
    : [];
  const searchParamFields = validatorProps.searchParamsVarName
    ? extractZodObjectFields(fileContent, validatorProps.searchParamsVarName)
    : [];

  return {
    method,
    configFileName,
    hasBody: validatorProps.hasBody,
    hasParams: validatorProps.hasParams,
    hasHeaders: validatorProps.hasHeaders,
    hasSearchParams: validatorProps.hasSearchParams,
    hasAuth: validatorProps.hasAuth,
    bodyFields,
    paramFields,
    searchParamFields,
  };
}

interface ValidatorProperties {
  hasBody: boolean;
  hasParams: boolean;
  hasHeaders: boolean;
  hasSearchParams: boolean;
  hasAuth: boolean;
  bodyVarName: string | null;
  paramsVarName: string | null;
  searchParamsVarName: string | null;
}

/**
 * Extract which properties are passed to createRequestValidator({...}).
 * Also resolves the variable names for body, params, searchParams so we
 * can look up their z.object() definitions.
 */
function extractValidatorProperties(source: string): ValidatorProperties {
  const result: ValidatorProperties = {
    hasBody: false,
    hasParams: false,
    hasHeaders: false,
    hasSearchParams: false,
    hasAuth: false,
    bodyVarName: null,
    paramsVarName: null,
    searchParamsVarName: null,
  };

  // Find createRequestValidator({...}) call - use a balanced brace approach
  const callStart = source.indexOf("createRequestValidator(");
  if (callStart === -1) return result;

  // Find the opening brace of the object argument
  const objStart = source.indexOf("{", callStart);
  if (objStart === -1) return result;

  // Find matching closing brace (handle nesting)
  const objContent = extractBalancedBraces(source, objStart);
  if (!objContent) return result;

  // Check for each property in the object literal
  result.hasBody = /\bbody\s*[:,]/.test(objContent);
  result.hasParams = /\bparams\s*[:,]/.test(objContent);
  result.hasHeaders = /\bheaders\s*[:,]/.test(objContent);
  result.hasSearchParams = /\bsearchParams\s*[:,]/.test(objContent);
  result.hasAuth = /\buser\s*[:,]/.test(objContent);

  // Extract variable names for schemas we need to parse further
  result.bodyVarName = extractPropertyValue(objContent, "body");
  result.paramsVarName = extractPropertyValue(objContent, "params");
  result.searchParamsVarName = extractPropertyValue(objContent, "searchParams");

  return result;
}

/**
 * Extract content between balanced braces starting at the given position.
 */
function extractBalancedBraces(
  source: string,
  startIndex: number,
): string | null {
  if (source[startIndex] !== "{") return null;

  let depth = 0;
  for (let i = startIndex; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;
    if (depth === 0) {
      return source.slice(startIndex + 1, i);
    }
  }
  return null;
}

/**
 * Extract the variable name assigned to a property in an object literal.
 * Handles both shorthand `{ body }` and explicit `{ body: bodyValidator }`.
 *
 * @example extractPropertyValue("body: bodyValidator, params: p", "body") => "bodyValidator"
 * @example extractPropertyValue("body, params", "body") => "body"
 */
function extractPropertyValue(
  objContent: string,
  propName: string,
): string | null {
  // Try explicit assignment: `propName: varName`
  const explicitMatch = new RegExp(
    `\\b${propName}\\s*:\\s*([a-zA-Z_$][a-zA-Z0-9_$]*)`,
    "m",
  ).exec(objContent);
  if (explicitMatch?.[1]) {
    return explicitMatch[1];
  }

  // Try shorthand: just `propName` as an identifier
  const shorthandMatch = new RegExp(`\\b${propName}\\b`).exec(objContent);
  if (shorthandMatch) {
    return propName;
  }

  return null;
}

/**
 * Extract field names and Zod types from a z.object({...}) definition.
 *
 * Looks for a variable declaration like:
 *   const varName = z.object({ field1: z.string(), field2: z.number() })
 *
 * Also handles inline z.object() definitions when the variable name matches
 * the pattern directly (e.g., `body: z.object({...})`).
 *
 * @param source - Full source text of the config file
 * @param varName - The variable name to look for
 * @returns Array of field info objects
 */
export function extractZodObjectFields(
  source: string,
  varName: string,
): FieldInfo[] {
  // Pattern 1: const varName = z.object({...})
  const varDeclPattern = new RegExp(
    `(?:const|let|var)\\s+${escapeRegex(varName)}[^=]*=\\s*z\\.object\\s*\\(`,
    "m",
  );
  let match = varDeclPattern.exec(source);

  if (match) {
    const parenStart = source.indexOf("(", match.index + match[0].length - 1);
    const objStart = source.indexOf("{", parenStart);
    if (objStart !== -1) {
      const objContent = extractBalancedBraces(source, objStart);
      if (objContent) {
        return parseObjectFields(objContent);
      }
    }
  }

  // Pattern 2: inline z.object({...}) when varName itself is a z.object call
  // This handles cases where the property directly uses z.object
  const inlinePattern = new RegExp(
    `\\b${escapeRegex(varName)}\\s*:\\s*z\\.object\\s*\\(`,
    "m",
  );
  match = inlinePattern.exec(source);
  if (match) {
    const parenStart = source.indexOf("(", match.index + match[0].length - 1);
    const objStart = source.indexOf("{", parenStart);
    if (objStart !== -1) {
      const objContent = extractBalancedBraces(source, objStart);
      if (objContent) {
        return parseObjectFields(objContent);
      }
    }
  }

  return [];
}

/**
 * Parse field definitions from inside a z.object({...}) body.
 * Extracts field names and their Zod type (first method call after `z.`).
 *
 * @example parseObjectFields("title: z.string().min(1),\ncontent: z.string()") =>
 *   [{ name: "title", zodType: "string" }, { name: "content", zodType: "string" }]
 */
function parseObjectFields(objContent: string): FieldInfo[] {
  const fields: FieldInfo[] = [];

  // Match field definitions: identifier: z.type(...)
  const fieldPattern = /(\w+)\s*:\s*z\.(\w+)/g;
  let fieldMatch: RegExpExecArray | null;

  while ((fieldMatch = fieldPattern.exec(objContent)) !== null) {
    const name = fieldMatch[1];
    const zodType = fieldMatch[2];
    if (name && zodType) {
      fields.push({ name, zodType });
    }
  }

  return fields;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
