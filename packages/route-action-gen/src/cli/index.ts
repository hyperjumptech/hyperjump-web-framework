#!/usr/bin/env node

/**
 * CLI entry point for route-action-gen.
 *
 * Usage:
 *   npx route-action-gen [options]
 *
 * Options:
 *   --help                Show help message
 *   --version             Show version number
 *   --framework <name>    Framework target (default: next-app-router)
 */

import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";
import { scanConfigFiles } from "./scanner";
import { parseConfigFile } from "./parser";
import {
  getFrameworkGenerator,
  getAvailableFrameworks,
  DEFAULT_FRAMEWORK,
} from "./frameworks/index";
import type { CliDeps, GenerationContext } from "./types";

// Re-export modules for testing
export { scanConfigFiles } from "./scanner";
export { parseConfigFile, extractZodObjectFields } from "./parser";
export {
  pascalCase,
  camelCase,
  extractDynamicSegments,
  buildFetchUrlExpression,
  zodTypeToInputType,
  fieldNameToLabel,
} from "./utils";
export {
  getFrameworkGenerator,
  getAvailableFrameworks,
  DEFAULT_FRAMEWORK,
} from "./frameworks/index";
export type {
  ParsedConfig,
  GenerationContext,
  GeneratedFile,
  FieldInfo,
  FrameworkGenerator,
  HttpMethod,
} from "./types";

export const VERSION = "0.0.0";

export const HELP_TEXT = `
route-action-gen v${VERSION}

Generate route handlers, server functions, form actions, and React hooks
from route config files.

Usage:
  npx route-action-gen [options]

Options:
  --help                Show this help message
  --version             Show version number
  --framework <name>    Framework target (default: ${DEFAULT_FRAMEWORK})

Available frameworks:
  ${getAvailableFrameworks().join(", ")}

Config files:
  Create route.[method].config.ts files (e.g., route.post.config.ts)
  in your route directories. The CLI will scan for these files and
  generate code in a .generated/ subdirectory.
`.trim();

interface CliArgs {
  help: boolean;
  version: boolean;
  framework: string;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    help: false,
    version: false,
    framework: DEFAULT_FRAMEWORK,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--version" || arg === "-v") {
      args.version = true;
    } else if (arg === "--framework" || arg === "-f") {
      const next = argv[i + 1];
      if (!next || next.startsWith("-")) {
        console.error("Error: --framework requires a value");
        process.exit(1);
      }
      args.framework = next;
      i++; // skip next arg
    }
  }

  return args;
}

/**
 * Core generation function. Separated from CLI for testability.
 *
 * @param deps - Injected dependencies (fs, glob, etc.)
 * @param frameworkName - Which framework generator to use
 * @returns Result with success status and list of generated files
 */
export function generate(
  deps: CliDeps,
  frameworkName: string,
): {
  success: boolean;
  generated?: { directory: string; files: string[] }[];
  error?: string;
} {
  const generator = getFrameworkGenerator(frameworkName);
  if (!generator) {
    return {
      success: false,
      error: `Unknown framework: "${frameworkName}". Available: ${getAvailableFrameworks().join(", ")}`,
    };
  }

  const cwd = deps.cwd();
  const groups = scanConfigFiles(deps.globSync, cwd);

  if (groups.length === 0) {
    return {
      success: false,
      error:
        "No route config files found. Create route.[method].config.ts files (e.g., route.post.config.ts) in your route directories.",
    };
  }

  const results: { directory: string; files: string[] }[] = [];

  for (const group of groups) {
    // Parse each config file in the group
    const parsedConfigs = group.configs.map((scanned) => {
      const content = deps.readFileSync(scanned.absolutePath);
      return parseConfigFile(content, scanned.method, scanned.fileName);
    });

    // Compute the route path using the framework generator
    const routePath = generator.resolveRoutePath(group.directory);

    const context: GenerationContext = {
      directory: group.directory,
      routePath,
      configs: parsedConfigs,
    };

    // Generate files
    const generatedFiles = generator.generate(context);

    // Write files to .generated/ directory
    const generatedDir = path.join(group.directory, ".generated");
    deps.mkdirSync(generatedDir, { recursive: true });

    const writtenFiles: string[] = [];
    for (const file of generatedFiles) {
      const filePath = path.join(generatedDir, file.fileName);
      deps.writeFileSync(filePath, file.content);
      writtenFiles.push(file.fileName);
    }

    results.push({
      directory: group.directory,
      files: writtenFiles,
    });
  }

  return { success: true, generated: results };
}

/**
 * Main CLI entry point.
 */
export function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  if (args.version) {
    console.log(VERSION);
    process.exit(0);
  }

  const deps: CliDeps = {
    globSync: (pattern, options) => globSync(pattern, options),
    readFileSync: (filePath) => fs.readFileSync(filePath, "utf-8"),
    writeFileSync: (filePath, content) =>
      fs.writeFileSync(filePath, content, "utf-8"),
    mkdirSync: (dirPath, options) => fs.mkdirSync(dirPath, options),
    cwd: () => process.cwd(),
  };

  console.log(`route-action-gen v${VERSION}`);
  console.log(`Framework: ${args.framework}`);
  console.log(`Scanning for config files in: ${deps.cwd()}\n`);

  const result = generate(deps, args.framework);

  if (!result.success) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  if (result.generated) {
    for (const group of result.generated) {
      console.log(`Generated in ${group.directory}/.generated/:`);
      for (const file of group.files) {
        console.log(`  - ${file}`);
      }
      console.log();
    }

    const totalFiles = result.generated.reduce(
      (sum, g) => sum + g.files.length,
      0,
    );
    console.log(
      `Done! Generated ${totalFiles} file(s) in ${result.generated.length} directory(ies).`,
    );
  }
}

// Only run main() when this file is executed directly (not when imported)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("/cli/index.js") ||
    process.argv[1].endsWith("/cli/index.ts"));

if (isDirectRun) {
  main();
}
