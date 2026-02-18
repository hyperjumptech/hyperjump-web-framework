import { Resend } from "resend";
import type { EmailMessage, EmailResult, EmailTransport } from "../types";

/** Configuration for the Resend email transport. */
export interface ResendConfig {
  /** Resend API key (starts with `re_`). */
  apiKey: string;
}

/** Minimal interface of the Resend client needed for sending emails. */
export interface ResendClient {
  emails: {
    send(payload: {
      from: string;
      to: string | string[];
      subject: string;
      html: string;
    }): Promise<{
      data: { id: string } | null;
      error: { message: string } | null;
    }>;
  };
}

/**
 * Sends an email message via the Resend API.
 *
 * @param message - The rendered email message.
 * @param client - A Resend client instance (or compatible fake).
 * @returns The send result with `success` and optional `messageId`.
 * @throws When the Resend API returns an error.
 */
export const sendViaResend = async (
  message: EmailMessage,
  client: ResendClient,
): Promise<EmailResult> => {
  const { data, error } = await client.emails.send({
    from: message.from,
    to: message.to,
    subject: message.subject,
    html: message.html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, messageId: data?.id };
};

/**
 * Creates a Resend-based email transport.
 *
 * @param config - Resend API key configuration.
 * @param client - Resend client instance. Defaults to a real Resend client
 *   created from `config.apiKey`. Override in tests with a fake.
 * @returns An {@link EmailTransport} that sends via Resend.
 */
export const createResendTransport = (
  config: ResendConfig,
  client: ResendClient = new Resend(config.apiKey),
): EmailTransport => ({
  send: (message) => sendViaResend(message, client),
});
