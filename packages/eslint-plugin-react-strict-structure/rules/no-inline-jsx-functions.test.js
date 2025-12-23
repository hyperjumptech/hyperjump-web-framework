import { RuleTester } from "eslint";
import { noInlineJsxFunctions } from "./no-inline-jsx-functions.js";

new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
}).run("no-inline-jsx-functions", noInlineJsxFunctions, {
  valid: [
    {
      code: `function MyComponent() { return <div>Hello</div>; }`,
    },
    {
      code: `const Helper = () => <span>Helper</span>; function MyComponent() { return <Helper />; }`,
    },
  ],
  invalid: [
    {
      code: `
        function MyComponent() {
          function NestedHelper() {
            return <div>Bad</div>;
          }
          return <NestedHelper />;
        }
      `,
      errors: [{ messageId: "noInlineJsx" }],
    },
    {
      code: `
        const MyComponent = () => {
          const renderItem = () => <span>Item</span>; 
          return <div>{renderItem()}</div>;
        };
      `,
      errors: [{ messageId: "noInlineJsx" }],
    },
  ],
});