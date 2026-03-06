import { describe, it, expect, vi, afterEach } from "vitest";
import { findProjectRoot } from "./find-project-root.js";
import path from "node:path";

describe("findProjectRoot", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the directory that contains package.json when walking up", () => {
    // Setup: only /project has package.json
    const projectRoot = path.resolve("/project");
    const configDir = path.join(projectRoot, "app", "dashboard", "tickers");
    const existsSync = vi.fn((filePath: string) => {
      return filePath === path.join(projectRoot, "package.json");
    });

    // Act
    const result = findProjectRoot(configDir, existsSync);

    // Assert
    expect(result).toBe(projectRoot);
    expect(existsSync).toHaveBeenCalledWith(
      path.join(projectRoot, "package.json"),
    );
  });

  it("returns the first ancestor with package.json when multiple exist", () => {
    // Setup: both /project and /project/app have package.json; we want the nearest (first found when walking up)
    const projectRoot = path.resolve("/project");
    const appDir = path.join(projectRoot, "app");
    const configDir = path.join(appDir, "dashboard");
    const existsSync = vi.fn((filePath: string) => {
      return (
        filePath === path.join(projectRoot, "package.json") ||
        filePath === path.join(appDir, "package.json")
      );
    });

    // Act
    const result = findProjectRoot(configDir, existsSync);

    // Assert: should find app's package.json first (nearest when walking up)
    expect(result).toBe(appDir);
  });

  it("returns null when no ancestor has package.json", () => {
    // Setup: no directory has package.json
    const configDir = path.resolve("/some", "deep", "directory");
    const existsSync = vi.fn(() => false);

    // Act
    const result = findProjectRoot(configDir, existsSync);

    // Assert
    expect(result).toBeNull();
  });

  it("returns the given directory when it contains package.json", () => {
    // Setup: the directory itself has package.json
    const projectRoot = path.resolve("/project");
    const existsSync = vi.fn((filePath: string) => {
      return filePath === path.join(projectRoot, "package.json");
    });

    // Act
    const result = findProjectRoot(projectRoot, existsSync);

    // Assert
    expect(result).toBe(projectRoot);
  });
});
