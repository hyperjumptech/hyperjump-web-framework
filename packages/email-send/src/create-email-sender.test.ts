import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmailSender } from "./create-email-sender";
import type { EmailMessage, EmailResult, EmailTransport } from "./types";

const createFakeTransport = (
  result: EmailResult = { success: true, messageId: "fake-id" },
): EmailTransport & { lastMessage: EmailMessage | undefined } => {
  const transport: EmailTransport & { lastMessage: EmailMessage | undefined } =
    {
      lastMessage: undefined,
      async send(message: EmailMessage): Promise<EmailResult> {
        transport.lastMessage = message;
        return result;
      },
    };
  return transport;
};

const fakeRender = async (): Promise<string> => "<html>rendered</html>";

describe("createEmailSender", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the template and sends via transport", async () => {
    // Setup
    const transport = createFakeTransport();
    const sender = createEmailSender({
      from: "noreply@example.com",
      transport,
      render: fakeRender,
    });

    // Act
    const result = await sender.send({
      to: "user@example.com",
      subject: "Welcome!",
      template: "user/signup",
      data: { name: "Alice", verifyUrl: "https://example.com/verify" },
    });

    // Assert
    expect(result).toEqual({ success: true, messageId: "fake-id" });
    expect(transport.lastMessage).toEqual({
      from: "noreply@example.com",
      to: "user@example.com",
      subject: "Welcome!",
      html: "<html>rendered</html>",
    });
  });

  it("uses per-send from address when provided", async () => {
    // Setup
    const transport = createFakeTransport();
    const sender = createEmailSender({
      from: "default@example.com",
      transport,
      render: fakeRender,
    });

    // Act
    await sender.send({
      to: "user@example.com",
      subject: "Reset",
      template: "user/password-forgot",
      data: { name: "Bob", resetUrl: "https://example.com/reset" },
      from: "override@example.com",
    });

    // Assert
    expect(transport.lastMessage!.from).toBe("override@example.com");
  });

  it("falls back to config from when per-send from is omitted", async () => {
    // Setup
    const transport = createFakeTransport();
    const sender = createEmailSender({
      from: "default@example.com",
      transport,
      render: fakeRender,
    });

    // Act
    await sender.send({
      to: "user@example.com",
      subject: "Hello",
      template: "user/signup",
      data: { name: "Carol", verifyUrl: "https://example.com" },
    });

    // Assert
    expect(transport.lastMessage!.from).toBe("default@example.com");
  });

  it("propagates transport errors", async () => {
    // Setup
    const transport: EmailTransport = {
      async send(): Promise<EmailResult> {
        throw new Error("Transport failure");
      },
    };
    const sender = createEmailSender({
      from: "noreply@example.com",
      transport,
      render: fakeRender,
    });

    // Act & Assert
    await expect(
      sender.send({
        to: "user@example.com",
        subject: "Fail",
        template: "user/signup",
        data: { name: "Dave", verifyUrl: "https://example.com" },
      }),
    ).rejects.toThrow("Transport failure");
  });

  it("passes template and data to the render function", async () => {
    // Setup
    const transport = createFakeTransport();
    const render = vi.fn().mockResolvedValue("<html>mock</html>");
    const sender = createEmailSender({
      from: "noreply@example.com",
      transport,
      render,
    });

    // Act
    await sender.send({
      to: "user@example.com",
      subject: "Test",
      template: "user/signup",
      data: { name: "Eve", verifyUrl: "https://example.com/verify" },
    });

    // Assert
    expect(render).toHaveBeenCalledWith("user/signup", {
      name: "Eve",
      verifyUrl: "https://example.com/verify",
    });
  });

  it("supports array of recipients", async () => {
    // Setup
    const transport = createFakeTransport();
    const sender = createEmailSender({
      from: "noreply@example.com",
      transport,
      render: fakeRender,
    });

    // Act
    await sender.send({
      to: ["a@example.com", "b@example.com"],
      subject: "Batch",
      template: "user/signup",
      data: { name: "Team", verifyUrl: "https://example.com" },
    });

    // Assert
    expect(transport.lastMessage!.to).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });
});
