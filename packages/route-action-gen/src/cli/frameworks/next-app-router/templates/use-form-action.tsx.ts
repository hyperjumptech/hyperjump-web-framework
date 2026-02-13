/**
 * Template for the generated `use-form-action.tsx` file.
 *
 * Produces a React hook that wraps the form action with
 * `useActionState` and provides a `FormWithAction` component.
 */

import { GENERATED_HEADER } from "../../../constants.js";

export interface UseFormActionTemplateData {
  /** Config file name, e.g. "route.post.config.ts" */
  configFileName: string;
}

export function useFormActionTemplate(d: UseFormActionTemplateData): string {
  return `${GENERATED_HEADER}
"use client";

import { useActionState, useMemo } from "react";
import { formAction } from "./form.action";
import { createFormWithAction } from "route-action-gen/lib/react";

/**
 * A custom hook to use the form action that executes the handler function in the \`${d.configFileName}\` file.

 * @returns An object with the \`FormWithAction\`, \`state\`, and \`pending\` properties.
 */
export const useFormAction = () => {
  const [state, action, pending] = useActionState(formAction, null);
  const FormWithAction = useMemo(() => createFormWithAction(action), [action]);

  return useMemo(
    () => ({
      /**
       * The <form> React component with the action. You can add \`className\` to the form to style it.
       */
      FormWithAction,
      /**
       * The state of the action, i.e., the result of the action.
       */
      state,
      /**
       * Whether the action is pending. If true, the form is submitting.
       */
      pending,
    }),
    [FormWithAction, state, pending]
  );
};
`;
}
