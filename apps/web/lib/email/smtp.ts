import {
  createEmailSender,
  createResendTransport,
  createSmtpTransport,
  EmailSender,
} from "@workspace/email-send";
import { env } from "@workspace/env";

let emailSender: EmailSender | null = null;

export const getEmailSender = ({
  from = "HyperJump <noreply@hyperjump.com>",
}: {
  from?: string;
} = {}): EmailSender => {
  if (!emailSender) {
    if (env.NODE_ENV === "production" && !env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    emailSender = createEmailSender({
      from,
      transport:
        env.NODE_ENV === "production"
          ? createResendTransport({
              apiKey: env.RESEND_API_KEY!,
            })
          : createSmtpTransport({
              host: "localhost",
              port: 2500,
            }),
    });
  }
  return emailSender;
};
