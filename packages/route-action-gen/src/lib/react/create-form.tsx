import {
  FormHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from "react";

/**
 * Creates a form React component with the action
 * @param action - The action to be used for the form
 * @returns A form React component with the action
 */
export const createFormWithAction = (
  action: FormHTMLAttributes<HTMLFormElement>["action"],
) => {
  const FormWithAction = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  } & HTMLAttributes<HTMLFormElement>) => {
    return (
      <form action={action} {...props}>
        {children}
      </form>
    );
  };

  return FormWithAction;
};

/**
 * Creates a input React component
 * @param name - The name of the input
 * @param type - The type of the input
 * @param id - The id of the input
 * @returns A input React component
 */
export const createInput = ({
  name,
  type,
  id,
  ...defaultProps
}: InputHTMLAttributes<HTMLInputElement>) => {
  const FormInput = (props: InputHTMLAttributes<HTMLInputElement>) => {
    return (
      <input type={type} name={name} id={id} {...defaultProps} {...props} />
    );
  };

  return FormInput;
};

/**
 * Creates a label React component
 * @param id - The id of the label
 * @returns A label React component
 */
export const createLabel = ({
  id,
  placeholderChildren,
}: LabelHTMLAttributes<HTMLLabelElement> & {
  placeholderChildren?: React.ReactNode;
}) => {
  const FormLabel = ({ children }: { children?: React.ReactNode }) => {
    return <label htmlFor={id}>{children ?? placeholderChildren}</label>;
  };

  return FormLabel;
};
