import { noInlineJsxFunctions } from "./rules/no-inline-jsx-functions.js";

export default {
  rules: {
    'no-inline-jsx-functions': noInlineJsxFunctions,
  },
  configs: {
    recommended: {
      plugins: ['react-strict-structure'],
      rules: {
        'react-strict-structure/no-inline-jsx-functions': 'error',
      },
    },
  },
};
