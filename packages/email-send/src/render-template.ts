import { render } from "@react-email/components";
import { templates, type TemplateMap } from "@workspace/email-templates";
import { createElement } from "react";

/**
 * Renders an email template to an HTML string.
 *
 * Looks up the React component from the template registry by name, passes
 * the provided data as props, and returns the rendered HTML.
 *
 * @param template - The template identifier (e.g. `"user/signup"`).
 * @param data - Props matching the chosen template's expected shape.
 * @returns The rendered HTML string.
 */
export const renderTemplate = async <T extends keyof TemplateMap>(
  template: T,
  data: TemplateMap[T],
): Promise<string> => {
  const Component = templates[template];
  return render(createElement(Component, data));
};
