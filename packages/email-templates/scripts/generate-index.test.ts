import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildEntries,
  extractExports,
  findTemplateFiles,
  generate,
  generateIndexContent,
} from "./generate-index";

const TEMPLATE_CONTENT = `import { Html } from "@react-email/components";

export interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
  return <Html>Hello {name}</Html>;
};

export default WelcomeEmail;
`;

const SECOND_TEMPLATE_CONTENT = `import { Html } from "@react-email/components";

export interface InviteEmailProps {
  inviteUrl: string;
}

export const InviteEmail = ({ inviteUrl }: InviteEmailProps) => {
  return <Html>{inviteUrl}</Html>;
};

export default InviteEmail;
`;

describe("findTemplateFiles", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "email-templates-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds .tsx files recursively", () => {
    // Setup
    const sub = path.join(tmpDir, "user");
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, "signup.tsx"), TEMPLATE_CONTENT);

    // Act
    const files = findTemplateFiles(tmpDir);

    // Assert
    expect(files).toEqual([path.join(sub, "signup.tsx")]);
  });

  it("excludes .test.tsx files", () => {
    // Setup
    fs.writeFileSync(path.join(tmpDir, "signup.tsx"), TEMPLATE_CONTENT);
    fs.writeFileSync(path.join(tmpDir, "signup.test.tsx"), "test file");

    // Act
    const files = findTemplateFiles(tmpDir);

    // Assert
    expect(files).toEqual([path.join(tmpDir, "signup.tsx")]);
  });

  it("returns sorted results across nested directories", () => {
    // Setup
    const authDir = path.join(tmpDir, "auth");
    const userDir = path.join(tmpDir, "user");
    fs.mkdirSync(authDir);
    fs.mkdirSync(userDir);
    fs.writeFileSync(path.join(userDir, "signup.tsx"), TEMPLATE_CONTENT);
    fs.writeFileSync(path.join(authDir, "invite.tsx"), TEMPLATE_CONTENT);

    // Act
    const files = findTemplateFiles(tmpDir);

    // Assert
    expect(files).toEqual([
      path.join(authDir, "invite.tsx"),
      path.join(userDir, "signup.tsx"),
    ]);
  });

  it("returns an empty array when no .tsx files exist", () => {
    // Act
    const files = findTemplateFiles(tmpDir);

    // Assert
    expect(files).toEqual([]);
  });
});

describe("extractExports", () => {
  it("extracts component name and props type from valid template content", () => {
    // Act
    const result = extractExports(TEMPLATE_CONTENT);

    // Assert
    expect(result).toEqual({
      componentName: "WelcomeEmail",
      propsTypeName: "WelcomeEmailProps",
    });
  });

  it("returns null when no props interface is found", () => {
    // Setup
    const content = `export const Foo = () => <div />;`;

    // Act
    const result = extractExports(content);

    // Assert
    expect(result).toBeNull();
  });

  it("returns null when no exported const is found", () => {
    // Setup
    const content = `export interface FooProps { name: string; }`;

    // Act
    const result = extractExports(content);

    // Assert
    expect(result).toBeNull();
  });
});

describe("buildEntries", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "email-templates-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("builds entries with correct keys, names, and import paths", () => {
    // Setup
    const sub = path.join(tmpDir, "user");
    fs.mkdirSync(sub);
    const filePath = path.join(sub, "welcome.tsx");
    fs.writeFileSync(filePath, TEMPLATE_CONTENT);

    // Act
    const entries = buildEntries([filePath], tmpDir);

    // Assert
    expect(entries).toEqual([
      {
        key: "user/welcome",
        componentName: "WelcomeEmail",
        propsTypeName: "WelcomeEmailProps",
        importPath: "./user/welcome",
      },
    ]);
  });

  it("skips files that fail extraction", () => {
    // Setup
    const filePath = path.join(tmpDir, "broken.tsx");
    fs.writeFileSync(filePath, "const x = 1;");

    // Act
    const entries = buildEntries([filePath], tmpDir);

    // Assert
    expect(entries).toEqual([]);
  });

  it("sorts entries alphabetically by key", () => {
    // Setup
    const userDir = path.join(tmpDir, "user");
    const authDir = path.join(tmpDir, "auth");
    fs.mkdirSync(userDir);
    fs.mkdirSync(authDir);
    const userFile = path.join(userDir, "welcome.tsx");
    const authFile = path.join(authDir, "invite.tsx");
    fs.writeFileSync(userFile, TEMPLATE_CONTENT);
    fs.writeFileSync(authFile, SECOND_TEMPLATE_CONTENT);

    // Act
    const entries = buildEntries([userFile, authFile], tmpDir);

    // Assert
    expect(entries[0]!.key).toBe("auth/invite");
    expect(entries[1]!.key).toBe("user/welcome");
  });
});

describe("generateIndexContent", () => {
  it("generates correct output for a single entry", () => {
    // Setup
    const entries = [
      {
        key: "user/signup",
        componentName: "SignupEmail",
        propsTypeName: "SignupEmailProps",
        importPath: "./user/signup",
      },
    ];

    // Act
    const content = generateIndexContent(entries);

    // Assert
    expect(content).toContain(
      "// @generated by scripts/generate-index.ts -- DO NOT EDIT",
    );
    expect(content).toContain(
      'import { SignupEmail, type SignupEmailProps } from "./user/signup";',
    );
    expect(content).toContain("export { SignupEmail, type SignupEmailProps };");
    expect(content).toContain('"user/signup": SignupEmailProps;');
    expect(content).toContain('"user/signup": SignupEmail,');
  });

  it("generates sorted entries for multiple templates", () => {
    // Setup
    const entries = [
      {
        key: "auth/invite",
        componentName: "InviteEmail",
        propsTypeName: "InviteEmailProps",
        importPath: "./auth/invite",
      },
      {
        key: "user/signup",
        componentName: "SignupEmail",
        propsTypeName: "SignupEmailProps",
        importPath: "./user/signup",
      },
    ];

    // Act
    const content = generateIndexContent(entries);

    // Assert
    const lines = content.split("\n");
    const importLines = lines.filter((l) => l.startsWith("import"));
    expect(importLines[0]).toContain("InviteEmail");
    expect(importLines[1]).toContain("SignupEmail");
  });

  it("generates empty TemplateMap for zero entries", () => {
    // Act
    const content = generateIndexContent([]);

    // Assert
    expect(content).toContain("export type TemplateMap = {");
    expect(content).toContain("};");
    expect(content).not.toContain("import");
  });
});

describe("generate", () => {
  let tmpDir: string;
  let srcDir: string;
  let outputPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "email-templates-gen-"));
    srcDir = path.join(tmpDir, "src");
    fs.mkdirSync(srcDir);
    outputPath = path.join(srcDir, "index.ts");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes a generated index.ts from scanned templates", () => {
    // Setup
    const userDir = path.join(srcDir, "user");
    fs.mkdirSync(userDir);
    fs.writeFileSync(path.join(userDir, "welcome.tsx"), TEMPLATE_CONTENT);

    // Act
    generate(srcDir, outputPath);

    // Assert
    const content = fs.readFileSync(outputPath, "utf-8");
    expect(content).toContain("// @generated");
    expect(content).toContain("WelcomeEmail");
    expect(content).toContain("WelcomeEmailProps");
    expect(content).toContain('"user/welcome"');
  });

  it("produces valid output with multiple templates across directories", () => {
    // Setup
    const userDir = path.join(srcDir, "user");
    const authDir = path.join(srcDir, "auth");
    fs.mkdirSync(userDir);
    fs.mkdirSync(authDir);
    fs.writeFileSync(path.join(userDir, "welcome.tsx"), TEMPLATE_CONTENT);
    fs.writeFileSync(path.join(authDir, "invite.tsx"), SECOND_TEMPLATE_CONTENT);

    // Act
    generate(srcDir, outputPath);

    // Assert
    const content = fs.readFileSync(outputPath, "utf-8");
    expect(content).toContain('"auth/invite"');
    expect(content).toContain('"user/welcome"');
    expect(content).toContain("InviteEmail");
    expect(content).toContain("WelcomeEmail");
  });

  it("ignores test files in the output", () => {
    // Setup
    const userDir = path.join(srcDir, "user");
    fs.mkdirSync(userDir);
    fs.writeFileSync(path.join(userDir, "welcome.tsx"), TEMPLATE_CONTENT);
    fs.writeFileSync(path.join(userDir, "welcome.test.tsx"), "test file");

    // Act
    generate(srcDir, outputPath);

    // Assert
    const content = fs.readFileSync(outputPath, "utf-8");
    expect(content).not.toContain("test file");
    expect(content).toContain("WelcomeEmail");
  });
});
