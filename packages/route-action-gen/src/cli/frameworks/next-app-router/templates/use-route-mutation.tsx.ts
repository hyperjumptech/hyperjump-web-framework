/**
 * Template for the generated `use-route-[method].tsx` file (POST, PUT, PATCH, etc.).
 *
 * Produces a React hook with a `fetchData` callback that performs the
 * mutation request with abort/timeout support.
 */

import { GENERATED_HEADER } from "../../../constants.js";

export interface UseRouteMutationTemplateData {
  /** Relative import path to the config file (without extension), e.g. "../route.post.config" */
  configFileBase: string;
  /** Config file name, e.g. "route.post.config.ts" */
  configFileName: string;
  /** HTTP method, e.g. "post" */
  method: string;
  /** PascalCase method, e.g. "Post" */
  methodPascal: string;
  /** Pre-formatted input fields for the fetchData parameter, joined with newlines. */
  inputFields: string;
  /** Pre-joined destructuring parts, e.g. "params, body, options" */
  destructParts: string;
  /** Param extraction code, e.g. "      const { postId } = params;\n" or "" */
  paramExtraction: string;
  /** Route path with dynamic segments as template expressions, e.g. "/api/posts/${postId}" */
  fetchUrlExpr: string;
  /** Pre-formatted fetch options lines, joined with newlines. */
  fetchOpts: string;
}

export function useRouteMutationTemplate(
  d: UseRouteMutationTemplateData,
): string {
  return `${GENERATED_HEADER}
"use client";

import type { requestValidator, responseValidator } from "${d.configFileBase}";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";

/**
 * A custom hook to use the route ${d.method} that executes the handler function in the \`${d.configFileName}\` file.
 *
 * @returns An object with the \`data\`, \`error\`, \`isLoading\`, and \`fetchData\` properties.
 */
export const useRoute${d.methodPascal} = () => {
  const [data, setData] = useState<z.infer<typeof responseValidator> | null>(
    null
  );
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(
    async (
      inputData: {
${d.inputFields}
      },
      isCleanedUp?: () => boolean
    ) => {
      setIsLoading(true);
      setError(null);
      setData(null);

      const { ${d.destructParts} } = inputData;
      const { abortController = new AbortController(), timeoutMs = 10_000 } =
        options ?? {};
${d.paramExtraction}
      const combinedSignal = AbortSignal.any([
        abortController?.signal,
        AbortSignal.timeout(timeoutMs),
      ]);

      try {
        const response = await fetch(\`${d.fetchUrlExpr}\`, {
${d.fetchOpts}
        });

        if (!response.ok) {
          const error = await response.json();
          setError(new Error(error.message));
          return;
        }

        if (!isCleanedUp?.()) {
          const responseData = await response.json();
          setData(responseData);
        }
      } catch (error) {
        if (!isCleanedUp?.()) {
          setError(error as Error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return useMemo(
    () => ({ data, error, isLoading, fetchData }),
    [data, error, isLoading, fetchData]
  );
};
`;
}
