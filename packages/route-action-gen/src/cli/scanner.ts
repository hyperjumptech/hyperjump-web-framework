/**
 * Scanner module: discovers route config files and groups them by directory.
 */

import path from "node:path";
import type { HttpMethod } from "./types.js";

/** The glob pattern to match route config files */
const CONFIG_GLOB =
  "**/route.{get,post,put,delete,patch,options,head}.config.ts";

/** Valid HTTP methods for config files */
const VALID_METHODS = new Set<string>([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
]);

/** Represents a discovered config file */
export interface ScannedConfig {
  /** Absolute path to the config file */
  absolutePath: string;
  /** Just the file name, e.g. "route.post.config.ts" */
  fileName: string;
  /** The HTTP method extracted from the file name */
  method: HttpMethod;
  /** Absolute path to the directory containing this config file */
  directory: string;
}

/** A group of config files in the same directory */
export interface ConfigGroup {
  /** Absolute directory path */
  directory: string;
  /** Config files in this directory */
  configs: ScannedConfig[];
}

/**
 * Extract the HTTP method from a config file name.
 * @example extractMethod("route.post.config.ts") => "post"
 */
export function extractMethod(fileName: string): HttpMethod | null {
  const match = fileName.match(/^route\.(\w+)\.config\.ts$/);
  if (!match || !match[1]) return null;
  const method = match[1].toLowerCase();
  if (!VALID_METHODS.has(method)) return null;
  return method as HttpMethod;
}

/**
 * Scan for route config files and group them by directory.
 *
 * @param globSync - Injected glob function for testability
 * @param cwd - Working directory to scan from
 * @returns Array of config groups, one per directory
 */
export function scanConfigFiles(
  globSync: (pattern: string, options?: { cwd?: string }) => string[],
  cwd: string,
): ConfigGroup[] {
  const files = globSync(CONFIG_GLOB, { cwd });

  const groupMap = new Map<string, ScannedConfig[]>();

  for (const relativePath of files) {
    const absolutePath = path.resolve(cwd, relativePath);
    const fileName = path.basename(relativePath);
    const directory = path.dirname(absolutePath);
    const method = extractMethod(fileName);

    if (!method) continue;

    const config: ScannedConfig = {
      absolutePath,
      fileName,
      method,
      directory,
    };

    const existing = groupMap.get(directory);
    if (existing) {
      existing.push(config);
    } else {
      groupMap.set(directory, [config]);
    }
  }

  const groups: ConfigGroup[] = [];
  for (const [directory, configs] of groupMap) {
    // Sort configs by method for deterministic output
    configs.sort((a, b) => a.method.localeCompare(b.method));
    groups.push({ directory, configs });
  }

  // Sort groups by directory for deterministic output
  groups.sort((a, b) => a.directory.localeCompare(b.directory));

  return groups;
}
