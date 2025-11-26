export const noProcessEnv = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow the use of process.env",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noProcessEnv:
        "Direct access to process.env is not allowed. Use env.{{envVar}} from `@workspace/env` instead.",
    },
    schema: [],
    fixable: "code",
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          node.object.name === "process" &&
          node.property.type === "Identifier" &&
          node.property.name === "env"
        ) {
          // Check if accessing specific env var like process.env.API_KEY
          const parent = node.parent;
          let envVarName = null;

          if (parent.type === "MemberExpression" && parent.property) {
            envVarName = parent.property.name || parent.property.value;
          }

          context.report({
            node,
            messageId: "noProcessEnv",
            data: {
              envVar: envVarName || "<ENV_VAR>",
            },
            fix(fixer) {
              // Only provide fix if we have a specific env variable
              if (envVarName && parent.type === "MemberExpression") {
                const sourceCode = context.getSourceCode();
                const text = sourceCode.getText(parent);

                // Replace process.env.VAR with env.VAR
                const replacement = text.replace(/process\.env\./, "env.");

                // Check if env is already imported
                const program = sourceCode.ast;
                const hasEnvImport = program.body.some(
                  (statement) =>
                    statement.type === "ImportDeclaration" &&
                    statement.source.value === "@workspace/env" &&
                    statement.specifiers.some(
                      (spec) =>
                        spec.type === "ImportSpecifier" &&
                        spec.imported.name === "env"
                    )
                );

                if (hasEnvImport) {
                  // Just replace the usage
                  return fixer.replaceText(parent, replacement);
                } else {
                  // Add import and replace usage
                  const fixes = [];

                  // Find the position to insert the import (after last import or at top)
                  const lastImport = program.body
                    .filter((node) => node.type === "ImportDeclaration")
                    .pop();

                  const importStatement =
                    "import { env } from '@workspace/env';\n";

                  if (lastImport) {
                    // Insert after last import
                    fixes.push(
                      fixer.insertTextAfter(lastImport, "\n" + importStatement)
                    );
                  } else {
                    // Insert at the beginning of the file
                    fixes.push(
                      fixer.insertTextBeforeRange(
                        [0, 0],
                        importStatement + "\n"
                      )
                    );
                  }

                  // Replace the usage
                  fixes.push(fixer.replaceText(parent, replacement));

                  return fixes;
                }
              }
              return null;
            },
          });
        }
      },
    };
  },
};
