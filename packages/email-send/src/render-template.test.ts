import { describe, expect, it } from "vitest";
import { renderTemplate } from "./render-template";

describe("renderTemplate", () => {
  it("renders user/signup template with the given props", async () => {
    // Setup
    const data = { name: "Alice", verifyUrl: "https://example.com/verify" };

    // Act
    const html = await renderTemplate("user/signup", data);

    // Assert
    expect(html).toContain("Alice");
    expect(html).toContain("https://example.com/verify");
    expect(html).toContain("Verify Email");
  });

  it("renders user/password-forgot template with the given props", async () => {
    // Setup
    const data = { name: "Bob", resetUrl: "https://example.com/reset" };

    // Act
    const html = await renderTemplate("user/password-forgot", data);

    // Assert
    expect(html).toContain("Bob");
    expect(html).toContain("https://example.com/reset");
    expect(html).toContain("Reset Password");
  });

  it("returns a complete HTML document", async () => {
    // Act
    const html = await renderTemplate("user/signup", {
      name: "Test",
      verifyUrl: "https://example.com",
    });

    // Assert
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("</html>");
  });
});
