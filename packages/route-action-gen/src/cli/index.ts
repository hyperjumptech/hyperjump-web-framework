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
import { scanConfigFiles } from "./scanner.js";
import { parseConfigFile } from "./parser.js";
import {
  getFrameworkGenerator,
  getAvailableFrameworks,
  detectFrameworkGenerator,
  DEFAULT_FRAMEWORK,
} from "./frameworks/index.js";
import type { CliDeps, GenerationContext, HttpMethod } from "./types.js";
import { createConfigFile, isValidMethod } from "./create.js";

// Re-export modules for testing
export { scanConfigFiles } from "./scanner.js";
export { parseConfigFile, extractZodObjectFields } from "./parser.js";
export {
  pascalCase,
  camelCase,
  extractDynamicSegments,
  buildFetchUrlExpression,
  zodTypeToInputType,
  fieldNameToLabel,
} from "./utils.js";
export {
  getFrameworkGenerator,
  getAvailableFrameworks,
  detectFrameworkGenerator,
  DEFAULT_FRAMEWORK,
} from "./frameworks/index.js";
export type {
  ParsedConfig,
  GenerationContext,
  GeneratedFile,
  EntryPointFile,
  FieldInfo,
  FrameworkGenerator,
  HttpMethod,
} from "./types.js";
export {
  createConfigFile,
  getConfigTemplate,
  isValidMethod,
} from "./create.js";

export const VERSION = "0.0.0";

export const HELP_TEXT = `
route-action-gen v${VERSION}

Generate route handlers, server functions, form actions, and React hooks
from route config files.

Usage:
  npx route-action-gen [options]           Scan and generate code
  npx route-action-gen create <method> [directory]
                                           Scaffold a new config file

Commands:
  create <method> [dir]   Create a route.<method>.config.ts file.
                          Methods: get, post, put, delete, patch, options, head
                          Directory defaults to the current directory.
                          Use --force to overwrite an existing file.

Options:
  --help                Show this help message
  --version             Show version number
  --framework <name>    Framework target (default: ${DEFAULT_FRAMEWORK})
                        Use "auto" to detect per directory (pages/ vs app/).
  --force               Overwrite existing file (for create command)

Available frameworks:
  auto, ${getAvailableFrameworks().join(", ")}

Config files:
  Create route.[method].config.ts files (e.g., route.post.config.ts)
  in your route directories. The CLI will scan for these files and
  generate code in a .generated/ subdirectory.
`.trim();

export interface CliArgs {
  command: "generate" | "create";
  help: boolean;
  version: boolean;
  framework: string;
  /** HTTP method for the `create` command */
  createMethod?: HttpMethod;
  /** Target directory for the `create` command */
  createDir?: string;
  /** Overwrite existing file for the `create` command */
  force: boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    command: "generate",
    help: false,
    version: false,
    framework: DEFAULT_FRAMEWORK,
    force: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--version" || arg === "-v") {
      args.version = true;
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--framework" || arg === "-f") {
      const next = argv[i + 1];
      if (!next || next.startsWith("-")) {
        console.error("Error: --framework requires a value");
        process.exit(1);
      }
      args.framework = next;
      i++; // skip next arg
    } else if (arg === "create") {
      args.command = "create";

      // Next positional: HTTP method (required)
      const methodArg = argv[i + 1];
      if (!methodArg || methodArg.startsWith("-")) {
        console.error(
          "Error: create requires an HTTP method.\n" +
            "Usage: route-action-gen create <method> [directory]\n" +
            "Methods: get, post, put, delete, patch, options, head",
        );
        process.exit(1);
      }

      const method = methodArg.toLowerCase();
      if (!isValidMethod(method)) {
        console.error(
          `Error: Invalid HTTP method "${methodArg}".\n` +
            "Valid methods: get, post, put, delete, patch, options, head",
        );
        process.exit(1);
      }

      args.createMethod = method;
      i++; // skip method arg

      // Next positional: directory (optional)
      const dirArg = argv[i + 1];
      if (dirArg && !dirArg.startsWith("-")) {
        args.createDir = dirArg;
        i++; // skip dir arg
      } else {
        args.createDir = ".";
      }
    }
  }

  return args;
}

/**
 * Core generation function. Separated from CLI for testability.
 *
 * @param deps - Injected dependencies (fs, glob, etc.)
 * @param frameworkName - Which framework generator to use, or "auto" to detect per directory
 * @returns Result with success status and list of generated files
 */
export function generate(
  deps: CliDeps,
  frameworkName: string,
): {
  success: boolean;
  generated?: {
    directory: string;
    generatedDir: string;
    files: string[];
    entryPointFile?: string;
    entryPointCreated: boolean;
    framework: string;
  }[];
  error?: string;
} {
  const isAuto = frameworkName === "auto";

  // When not auto, resolve the generator once up-front
  if (!isAuto) {
    const generator = getFrameworkGenerator(frameworkName);
    if (!generator) {
      return {
        success: false,
        error: `Unknown framework: "${frameworkName}". Available: auto, ${getAvailableFrameworks().join(", ")}`,
      };
    }
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

  const results: {
    directory: string;
    generatedDir: string;
    files: string[];
    entryPointFile?: string;
    entryPointCreated: boolean;
    framework: string;
  }[] = [];

  for (const group of groups) {
    // Pick the right generator for this directory
    const generator = isAuto
      ? detectFrameworkGenerator(group.directory)
      : getFrameworkGenerator(frameworkName)!;

    // Parse each config file in the group
    const parsedConfigs = group.configs.map((scanned) => {
      const content = deps.readFileSync(scanned.absolutePath);
      return parseConfigFile(content, scanned.method, scanned.fileName);
    });

    // Compute the route path using the framework generator
    const routePath = generator.resolveRoutePath(group.directory);

    // Resolve the generated output directory (may differ from config dir)
    const generatedDir = generator.resolveGeneratedDir(group.directory, cwd);

    // Compute relative import prefix from generated dir to config dir
    // e.g. "../" for App Router, "../../../../pages/api/users/" for Pages Router
    const configImportPrefix =
      path.relative(generatedDir, group.directory) + "/";

    const context: GenerationContext = {
      directory: group.directory,
      routePath,
      configs: parsedConfigs,
      configImportPrefix,
    };

    // Generate files
    const generatedFiles = generator.generate(context);

    // Write files to the generated directory
    deps.mkdirSync(generatedDir, { recursive: true });

    const writtenFiles: string[] = [];
    for (const file of generatedFiles) {
      const filePath = path.join(generatedDir, file.fileName);
      deps.writeFileSync(filePath, file.content);
      writtenFiles.push(file.fileName);
    }

    // Create entry point file if it doesn't exist
    const generatedDirRelPath = path.relative(group.directory, generatedDir);
    // Ensure the path starts with "./" or "../" for a valid import specifier
    const importPath = generatedDirRelPath.startsWith(".")
      ? generatedDirRelPath
      : `./${generatedDirRelPath}`;
    const entryPoint = generator.getEntryPointFile(importPath);
    const entryPointPath = path.join(group.directory, entryPoint.fileName);
    let entryPointCreated = false;

    if (!deps.existsSync(entryPointPath)) {
      deps.writeFileSync(entryPointPath, entryPoint.content);
      entryPointCreated = true;
    }

    results.push({
      directory: group.directory,
      generatedDir,
      files: writtenFiles,
      entryPointFile: entryPoint.fileName,
      entryPointCreated,
      framework: generator.name,
    });
  }

  return { success: true, generated: results };
}

/**
 * Build the real CLI dependency bag.
 */
function createDeps(): CliDeps {
  return {
    globSync: (pattern, options) => globSync(pattern, options),
    readFileSync: (filePath) => fs.readFileSync(filePath, "utf-8"),
    writeFileSync: (filePath, content) =>
      fs.writeFileSync(filePath, content, "utf-8"),
    mkdirSync: (dirPath, options) => fs.mkdirSync(dirPath, options),
    existsSync: (filePath) => fs.existsSync(filePath),
    cwd: () => process.cwd(),
  };
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

  const deps = createDeps();

  if (args.command === "create") {
    const result = createConfigFile(
      deps,
      args.createMethod!,
      args.createDir!,
      args.force,
    );

    if (!result.success) {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }

    console.log(`Created ${result.filePath}`);
    return;
  }

  // Default: generate command
  console.log(`route-action-gen v${VERSION}`);
  console.log(
    `Framework: ${args.framework}${args.framework === "auto" ? " (detect per directory)" : ""}`,
  );
  console.log(`Scanning for config files in: ${deps.cwd()}\n`);

  const result = generate(deps, args.framework);

  if (!result.success) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  if (result.generated) {
    for (const group of result.generated) {
      console.log(`Generated in ${group.generatedDir}/:`);
      for (const file of group.files) {
        console.log(`  - ${file}`);
      }
      if (group.entryPointCreated && group.entryPointFile) {
        console.log(
          `  Created entry point: ${group.directory}/${group.entryPointFile}`,
        );
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

    // Show Pages Router hint if any directories use the Pages Router
    const hasPagesRouter = result.generated.some(
      (g) => g.framework === "next-pages-router",
    );
    if (hasPagesRouter) {
      console.log(
        `\nNote: Next.js treats every file under pages/api/ as an API route.\n` +
          `Config files (route.*.config.ts) in pages/api/ need a no-op default export\n` +
          `to satisfy the ApiRouteConfig type constraint:\n\n` +
          `  export default function _noop() {}\n\n` +
          `Add this line to each route.*.config.ts file inside pages/api/.`,
      );
    }
  }
}

// Only run main() when this file is executed directly (not when imported).
// We resolve symlinks so that `npx route-action-gen` (which uses a bin
// symlink) correctly matches the real path of this module.
const isDirectRun = (() => {
  try {
    if (!process.argv[1]) return false;
    const scriptPath = fs.realpathSync(process.argv[1]);
    const modulePath = path.resolve(new URL(import.meta.url).pathname);
    return scriptPath === modulePath;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  main();
}
