/**
 * Framework generator registry.
 * Maps framework names (used with --framework flag) to their generator instances.
 *
 * When no --framework flag is given (i.e. "auto"), the CLI detects the correct
 * generator per directory based on whether the config lives under pages/ or app/.
 */

import type { FrameworkGenerator } from "../types.js";
import { NextAppRouterGenerator } from "./next-app-router.js";
import { NextPagesRouterGenerator } from "./next-pages-router.js";

/** All available framework generators */
const generators: FrameworkGenerator[] = [
  new NextAppRouterGenerator(),
  new NextPagesRouterGenerator(),
];

/** Registry mapping framework name -> generator */
const registry = new Map<string, FrameworkGenerator>(
  generators.map((g) => [g.name, g]),
);

/**
 * Get a framework generator by name.
 * @param name - Framework name, e.g. "next-app-router"
 * @returns The framework generator, or undefined if not found
 */
export function getFrameworkGenerator(
  name: string,
): FrameworkGenerator | undefined {
  return registry.get(name);
}

/**
 * Get all available framework names.
 */
export function getAvailableFrameworks(): string[] {
  return Array.from(registry.keys());
}

/**
 * Auto-detect which framework generator to use based on the config file's
 * directory path. If the path contains `/pages/`, use Pages Router; otherwise
 * default to App Router.
 *
 * @param directory - Absolute directory path containing the config files
 * @returns The appropriate framework generator
 */
export function detectFrameworkGenerator(
  directory: string,
): FrameworkGenerator {
  if (directory.includes("/pages/")) {
    return registry.get("next-pages-router")!;
  }
  return registry.get("next-app-router")!;
}

/**
 * Default framework name.
 * "auto" means the CLI will detect per-directory whether to use
 * App Router or Pages Router based on the config file location.
 */
export const DEFAULT_FRAMEWORK = "auto";
