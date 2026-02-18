import type { TemplateMap } from "@workspace/email-templates";
import { renderTemplate } from "./render-template";
import type {
  EmailResult,
  EmailSender,
  EmailSenderConfig,
  SendEmailOptions,
} from "./types";

/**
 * Creates a configured email sender that renders templates and delivers them
 * via the provided transport.
 *
 * @param config - Sender configuration including default `from`, transport, and
 *   an optional `render` override (defaults to the built-in `renderTemplate`).
 * @returns An {@link EmailSender} with a type-safe `send` method.
 */
export const createEmailSender = (config: EmailSenderConfig): EmailSender => {
  const renderFn = config.render ?? renderTemplate;

  return {
    async send<T extends keyof TemplateMap>(
      options: SendEmailOptions<T>,
    ): Promise<EmailResult> {
      const html = await renderFn(options.template, options.data);

      return config.transport.send({
        from: options.from ?? config.from,
        to: options.to,
        subject: options.subject,
        html,
      });
    },
  };
};
