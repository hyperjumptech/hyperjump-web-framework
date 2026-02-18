import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import { SignupEmail } from "./signup";

describe("SignupEmail", () => {
  it("renders the user's name in the heading", async () => {
    // Act
    const html = await render(
      <SignupEmail name="Alice" verifyUrl="https://example.com/verify" />,
    );

    // Assert
    expect(html).toContain("Welcome,");
    expect(html).toContain("Alice");
  });

  it("includes the verify URL as a link", async () => {
    // Setup
    const verifyUrl = "https://example.com/verify?token=abc";

    // Act
    const html = await render(<SignupEmail name="Bob" verifyUrl={verifyUrl} />);

    // Assert
    expect(html).toContain(verifyUrl);
  });

  it("includes an email preview text", async () => {
    // Act
    const html = await render(
      <SignupEmail name="Carol" verifyUrl="https://example.com/verify" />,
    );

    // Assert
    expect(html).toContain("Welcome — verify your email to get started");
  });

  it("renders a 'Verify Email' call-to-action button", async () => {
    // Act
    const html = await render(
      <SignupEmail name="Dave" verifyUrl="https://example.com/verify" />,
    );

    // Assert
    expect(html).toContain("Verify Email");
  });

  it("includes fallback text with the verify URL for non-HTML clients", async () => {
    // Setup
    const verifyUrl = "https://example.com/verify?token=xyz";

    // Act
    const html = await render(<SignupEmail name="Eve" verifyUrl={verifyUrl} />);

    // Assert
    const verifyUrlOccurrences = html.split(verifyUrl).length - 1;
    expect(verifyUrlOccurrences).toBeGreaterThanOrEqual(2);
  });
});
