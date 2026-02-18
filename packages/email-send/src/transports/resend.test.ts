import { describe, expect, it } from "vitest";
import type { EmailMessage } from "../types";
import {
  createResendTransport,
  type ResendClient,
  sendViaResend,
} from "./resend";

const createFakeMessage = (
  overrides?: Partial<EmailMessage>,
): EmailMessage => ({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Test Subject",
  html: "<p>Hello</p>",
  ...overrides,
});

const createFakeClient = (
  response: {
    data: { id: string } | null;
    error: { message: string } | null;
  } = {
    data: { id: "resend-msg-id" },
    error: null,
  },
): ResendClient & { lastPayload: Record<string, unknown> | undefined } => {
  const client: ResendClient & {
    lastPayload: Record<string, unknown> | undefined;
  } = {
    lastPayload: undefined,
    emails: {
      send: async (payload) => {
        client.lastPayload = payload;
        return response;
      },
    },
  };
  return client;
};

describe("sendViaResend", () => {
  it("sends the message and returns messageId on success", async () => {
    // Setup
    const message = createFakeMessage();
    const client = createFakeClient({ data: { id: "abc-123" }, error: null });

    // Act
    const result = await sendViaResend(message, client);

    // Assert
    expect(result).toEqual({ success: true, messageId: "abc-123" });
  });

  it("passes from, to, subject, and html to the client", async () => {
    // Setup
    const message = createFakeMessage({
      from: "a@b.com",
      to: ["x@y.com", "z@w.com"],
      subject: "Multi",
      html: "<b>Bold</b>",
    });
    const client = createFakeClient();

    // Act
    await sendViaResend(message, client);

    // Assert
    expect(client.lastPayload).toEqual({
      from: "a@b.com",
      to: ["x@y.com", "z@w.com"],
      subject: "Multi",
      html: "<b>Bold</b>",
    });
  });

  it("throws when the Resend API returns an error", async () => {
    // Setup
    const message = createFakeMessage();
    const client = createFakeClient({
      data: null,
      error: { message: "Invalid API key" },
    });

    // Act & Assert
    await expect(sendViaResend(message, client)).rejects.toThrow(
      "Invalid API key",
    );
  });

  it("returns undefined messageId when data is null but no error", async () => {
    // Setup
    const message = createFakeMessage();
    const client = createFakeClient({ data: null, error: null });

    // Act
    const result = await sendViaResend(message, client);

    // Assert
    expect(result).toEqual({ success: true, messageId: undefined });
  });
});

describe("createResendTransport", () => {
  it("returns an EmailTransport that delegates to the injected client", async () => {
    // Setup
    const client = createFakeClient({
      data: { id: "injected-id" },
      error: null,
    });
    const transport = createResendTransport({ apiKey: "re_unused" }, client);
    const message = createFakeMessage();

    // Act
    const result = await transport.send(message);

    // Assert
    expect(result).toEqual({ success: true, messageId: "injected-id" });
    expect(client.lastPayload).toBeDefined();
  });
});
