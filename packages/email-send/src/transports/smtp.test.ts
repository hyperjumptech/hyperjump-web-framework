import type Mail from "nodemailer/lib/mailer";
import { describe, expect, it } from "vitest";
import type { EmailMessage } from "../types";
import { createSmtpTransport, sendViaSMTP } from "./smtp";

const createFakeMessage = (
  overrides?: Partial<EmailMessage>,
): EmailMessage => ({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Test Subject",
  html: "<p>Hello</p>",
  ...overrides,
});

const createFakeTransporter = (
  messageId: string = "smtp-msg-id",
): Pick<Mail, "sendMail"> & { lastCall: Mail.Options | undefined } => {
  const fake: Pick<Mail, "sendMail"> & { lastCall: Mail.Options | undefined } =
    {
      lastCall: undefined,
      sendMail: async (options: Mail.Options) => {
        fake.lastCall = options;
        return { messageId } as never;
      },
    };
  return fake;
};

describe("sendViaSMTP", () => {
  it("sends the message via the transporter and returns the messageId", async () => {
    // Setup
    const message = createFakeMessage();
    const transporter = createFakeTransporter("test-123");

    // Act
    const result = await sendViaSMTP(message, transporter);

    // Assert
    expect(result).toEqual({ success: true, messageId: "test-123" });
  });

  it("passes from, to, subject, and html to sendMail", async () => {
    // Setup
    const message = createFakeMessage({
      from: "a@b.com",
      to: "c@d.com",
      subject: "Hi",
      html: "<b>Bold</b>",
    });
    const transporter = createFakeTransporter();

    // Act
    await sendViaSMTP(message, transporter);

    // Assert
    expect(transporter.lastCall).toEqual({
      from: "a@b.com",
      to: "c@d.com",
      subject: "Hi",
      html: "<b>Bold</b>",
    });
  });

  it("joins array recipients into a comma-separated string", async () => {
    // Setup
    const message = createFakeMessage({
      to: ["a@example.com", "b@example.com"],
    });
    const transporter = createFakeTransporter();

    // Act
    await sendViaSMTP(message, transporter);

    // Assert
    expect(transporter.lastCall!.to).toBe("a@example.com, b@example.com");
  });

  it("propagates transporter errors", async () => {
    // Setup
    const message = createFakeMessage();
    const transporter: Pick<Mail, "sendMail"> = {
      sendMail: async () => {
        throw new Error("SMTP connection refused");
      },
    };

    // Act & Assert
    await expect(sendViaSMTP(message, transporter)).rejects.toThrow(
      "SMTP connection refused",
    );
  });
});

describe("createSmtpTransport", () => {
  it("returns an EmailTransport that delegates to the injected transporter", async () => {
    // Setup
    const transporter = createFakeTransporter("injected-id");
    const transport = createSmtpTransport(
      { host: "unused", port: 587 },
      transporter,
    );
    const message = createFakeMessage();

    // Act
    const result = await transport.send(message);

    // Assert
    expect(result).toEqual({ success: true, messageId: "injected-id" });
    expect(transporter.lastCall).toBeDefined();
  });
});
