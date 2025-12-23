export const noInlineJsxFunctions = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent definition of inline functions that return JSX inside components",
      category: "Best Practices",
      recommended: true,
    },
    schema: [],
    messages: {
      noInlineJsx:
        "Avoid defining functions that return JSX inside components. Move this to a separate component or outside the body.",
    },
  },
  create(context) {
    return {
      // Check Function Declarations, Expressions, and Arrow Functions
      ":function"(node) {
        if (!parentFunction(parent(node.parent))) {
          // It's a top-level component, which is fine
          return;
        }

        if (isReturnJSX(node.body)) {
          context.report({
            node,
            messageId: "noInlineJsx",
          });
        }
      },
    };
  },
};

function parent(nodeParent) {
  let parent = nodeParent;
  while (parent) {
    if (isFunction(parent)) {
      return parent;
    }
    parent = parent.parent;
  }

  return parent;
}

function parentFunction(parent) {
  while (parent) {
    if (isFunction(parent)) {
      return parent;
    }
  }

  return null;
}

function isReturnJSX(nodeBody) {
  const { body, type } = nodeBody;
  if (type === "BlockStatement") {
    // Look for 'return <JSX />' inside the function body
    for (const { argument, type } of body) {
      if (type === "ReturnStatement" && isJSX(argument)) {
        return true;
      }
    }

    return false;
  }

  if (isJSX(nodeBody)) {
    // Implicit arrow return: () => <div />
    return true;
  }

  return false;
}

function isFunction(node) {
  if (!node) {
    return false;
  }

  return [
    "FunctionDeclaration",
    "FunctionExpression",
    "ArrowFunctionExpression",
  ].includes(node.type);
}

function isJSX(node) {
  if (!node) {
    return false;
  }

  const { type } = node;
  return type === "JSXElement" || type === "JSXFragment";
}
