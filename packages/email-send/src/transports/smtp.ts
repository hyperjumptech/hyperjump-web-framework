import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { EmailMessage, EmailResult, EmailTransport } from "../types";

/** SMTP connection configuration. */
export interface SmtpConfig {
  /** SMTP server hostname (e.g. `"smtp.example.com"`). */
  host: string;
  /** SMTP server port (e.g. `587` for STARTTLS, `465` for SSL). */
  port: number;
  /** Use implicit TLS (`true` for port 465, `false` for STARTTLS). */
  secure?: boolean;
  /** Optional SMTP authentication credentials. */
  auth?: {
    user: string;
    pass: string;
  };
}

/**
 * Sends an email message via a nodemailer transporter.
 *
 * @param message - The rendered email message.
 * @param transporter - The nodemailer transporter instance.
 * @returns The send result with `success` and optional `messageId`.
 */
export const sendViaSMTP = async (
  message: EmailMessage,
  transporter: Pick<Mail, "sendMail">,
): Promise<EmailResult> => {
  const info = (await transporter.sendMail({
    from: message.from,
    to: Array.isArray(message.to) ? message.to.join(", ") : message.to,
    subject: message.subject,
    html: message.html,
  })) as SMTPTransport.SentMessageInfo;

  return { success: true, messageId: info.messageId };
};

/**
 * Creates an SMTP-based email transport using nodemailer.
 *
 * @param config - SMTP server connection settings.
 * @param transporter - Nodemailer transporter instance. Defaults to one
 *   created from `config`. Override in tests with a fake.
 * @returns An {@link EmailTransport} that sends via SMTP.
 */
export const createSmtpTransport = (
  config: SmtpConfig,
  transporter: Pick<Mail, "sendMail"> = nodemailer.createTransport(config),
): EmailTransport => ({
  send: (message) => sendViaSMTP(message, transporter),
});
