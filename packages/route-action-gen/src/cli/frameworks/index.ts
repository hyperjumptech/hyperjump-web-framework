/**
 * Framework generator registry.
 * Maps framework names (used with --framework flag) to their generator instances.
 */

import type { FrameworkGenerator } from "../types";
import { NextAppRouterGenerator } from "./next-app-router";

/** All available framework generators */
const generators: FrameworkGenerator[] = [new NextAppRouterGenerator()];

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

/** Default framework name */
export const DEFAULT_FRAMEWORK = "next-app-router";
