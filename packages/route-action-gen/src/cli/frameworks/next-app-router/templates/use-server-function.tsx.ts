/**
 * Template for the generated `use-server-function.tsx` file.
 *
 * Produces a React hook that wraps the server function with
 * `useTransition` for pending-state awareness.
 */

import { GENERATED_HEADER } from "../../../constants.js";

export interface UseServerFunctionTemplateData {
  /** Relative import path to the config file (without extension), e.g. "../route.post.config" */
  configFileBase: string;
}

export function useServerFunctionTemplate(
  d: UseServerFunctionTemplateData,
): string {
  return `${GENERATED_HEADER}
"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { responseValidator } from "${d.configFileBase}";
import { serverFunction } from "./server.function";
import { z } from "zod";

/**
 * A custom hook to use the server function that executes the handler function in the \`server.function.ts\` file.
 *
 * @returns An object with the \`pending\`, \`fetchData\`, \`error\`, and \`data\` properties.
 */
export const useServerFunction = () => {
  const [pending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<z.infer<typeof responseValidator> | null>(
    null
  );
  const fetchData = useCallback(
    async (payload: Parameters<typeof serverFunction>[0]) => {
      startTransition(async () => {
        const result = await serverFunction(payload);
        if (result.status === false) {
          setError(result.message);
        } else {
          setData(result.data);
        }
      });
    },
    [startTransition]
  );

  return useMemo(
    () => ({
      pending,
      fetchData,
      error,
      data,
    }),
    [pending, error, data, fetchData]
  );
};
`;
}
