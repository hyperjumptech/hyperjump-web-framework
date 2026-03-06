import path from "node:path";

/**
 * Finds the project root by walking up from the given directory until a
 * directory containing package.json is found.
 *
 * @param directory - Absolute path to start from (e.g. config directory).
 * @param existsSync - Function to check if a file path exists (e.g. fs.existsSync).
 * @returns The absolute path of the directory containing package.json, or null if not found.
 */
export function findProjectRoot(
  directory: string,
  existsSync: (filePath: string) => boolean,
): string | null {
  let current = path.resolve(directory);
  const root = path.parse(current).root;

  while (current !== root) {
    const packagePath = path.join(current, "package.json");
    if (existsSync(packagePath)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return null;
}
