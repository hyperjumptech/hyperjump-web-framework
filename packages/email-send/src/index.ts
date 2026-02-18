export { createEmailSender } from "./create-email-sender";
export { renderTemplate } from "./render-template";
export { createSmtpTransport, type SmtpConfig } from "./transports/smtp";
export { createResendTransport, type ResendConfig } from "./transports/resend";
export type {
  EmailMessage,
  EmailResult,
  EmailSender,
  EmailSenderConfig,
  EmailTransport,
  SendEmailOptions,
} from "./types";
