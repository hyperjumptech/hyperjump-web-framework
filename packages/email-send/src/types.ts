import type { TemplateMap } from "@workspace/email-templates";

/** A rendered email message ready to be sent by a transport. */
export interface EmailMessage {
  /** Sender address (e.g. `"App <noreply@example.com>"`). */
  from: string;
  /** One or more recipient addresses. */
  to: string | string[];
  /** Email subject line. */
  subject: string;
  /** Rendered HTML body. */
  html: string;
}

/** The result returned after a transport sends an email. */
export interface EmailResult {
  /** Whether the send operation succeeded. */
  success: boolean;
  /** Provider-specific message identifier, if available. */
  messageId?: string;
}

/** Delivery mechanism that sends a rendered email message. */
export interface EmailTransport {
  /** Sends the given email message and returns the result. */
  send(message: EmailMessage): Promise<EmailResult>;
}

/** Configuration for creating an {@link EmailSender}. */
export interface EmailSenderConfig {
  /** Default sender address used when `from` is not specified per-send. */
  from: string;
  /** The transport used to deliver emails. */
  transport: EmailTransport;
  /**
   * Renders a template to an HTML string. Defaults to the built-in
   * `renderTemplate` implementation. Override in tests with a fake.
   */
  render?: <T extends keyof TemplateMap>(
    template: T,
    data: TemplateMap[T],
  ) => Promise<string>;
}

/** Options for a single {@link EmailSender.send} call. */
export interface SendEmailOptions<T extends keyof TemplateMap> {
  /** One or more recipient addresses. */
  to: string | string[];
  /** Email subject line. */
  subject: string;
  /** Template identifier (e.g. `"user/signup"`). */
  template: T;
  /** Template-specific data -- must match the template's props type. */
  data: TemplateMap[T];
  /** Override the sender address for this email only. */
  from?: string;
}

/** A configured email sender that renders templates and delivers them. */
export interface EmailSender {
  /**
   * Renders the given template with its data and sends the resulting email.
   *
   * @param options - Template, recipients, subject, and template data.
   * @returns The result of the send operation.
   */
  send<T extends keyof TemplateMap>(
    options: SendEmailOptions<T>,
  ): Promise<EmailResult>;
}
