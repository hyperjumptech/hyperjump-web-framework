import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import { PasswordForgotEmail } from "./password-forgot";

describe("PasswordForgotEmail", () => {
  it("renders the user's name in the greeting", async () => {
    // Act
    const html = await render(
      <PasswordForgotEmail name="Alice" resetUrl="https://example.com/reset" />,
    );

    // Assert
    expect(html).toContain("Hi");
    expect(html).toContain("Alice");
  });

  it("includes the reset URL as a link", async () => {
    // Setup
    const resetUrl = "https://example.com/reset?token=abc";

    // Act
    const html = await render(
      <PasswordForgotEmail name="Bob" resetUrl={resetUrl} />,
    );

    // Assert
    expect(html).toContain(resetUrl);
  });

  it("includes an email preview text", async () => {
    // Act
    const html = await render(
      <PasswordForgotEmail name="Carol" resetUrl="https://example.com/reset" />,
    );

    // Assert
    expect(html).toContain("Reset your password");
  });

  it("renders a 'Reset Password' call-to-action button", async () => {
    // Act
    const html = await render(
      <PasswordForgotEmail name="Dave" resetUrl="https://example.com/reset" />,
    );

    // Assert
    expect(html).toContain("Reset Password");
  });

  it("mentions the link expiration time", async () => {
    // Act
    const html = await render(
      <PasswordForgotEmail name="Eve" resetUrl="https://example.com/reset" />,
    );

    // Assert
    expect(html).toContain("expire in 1 hour");
  });

  it("includes fallback text with the reset URL for non-HTML clients", async () => {
    // Setup
    const resetUrl = "https://example.com/reset?token=xyz";

    // Act
    const html = await render(
      <PasswordForgotEmail name="Frank" resetUrl={resetUrl} />,
    );

    // Assert
    const resetUrlOccurrences = html.split(resetUrl).length - 1;
    expect(resetUrlOccurrences).toBeGreaterThanOrEqual(2);
  });
});
