/**
 * Template for the generated `use-route-get.tsx` file.
 *
 * Produces a React hook that auto-fetches data on mount and when
 * params/searchParams change, with cancel, refetch, and loading support.
 */

import { GENERATED_HEADER } from "../../../constants.js";

export interface UseRouteGetTemplateData {
  /** Config file name without .ts extension, e.g. "route.get.config" */
  configFileBase: string;
  /** Config file name, e.g. "route.get.config.ts" */
  configFileName: string;
  /** Full parameter signature, e.g. "input: {\n  params: ...;\n}" or "" */
  inputType: string;
  /**
   * The searchParams line block, or empty string.
   * When present: "\n  const searchParamsString = new URLSearchParams(input.searchParams).toString();\n"
   */
  searchParamsLine: string;
  /** The fetchURL construction line, e.g. '      const fetchURL = `${url}/api/posts/${input.params.postId}`;' */
  fetchUrlCode: string;
  /** Joined useEffect dependency array, e.g. "input.params.postId, lastFetchedAt" */
  effectDeps: string;
}

export function useRouteGetTemplate(d: UseRouteGetTemplateData): string {
  return `${GENERATED_HEADER}
import { requestValidator, responseValidator } from "../${d.configFileBase}";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

/**
 * A custom hook to use the route get that executes the handler function in the \`${d.configFileName}\` file.
 *
 * @param input - The input object with the params and search params.
 * @returns An object with the \`data\`, \`error\`, \`isLoading\`, \`cancel\`, \`refetch\`, and \`lastFetchedAt\` properties.
 */
export const useRouteGet = (${d.inputType}) => {
  const [data, setData] = useState<z.infer<typeof responseValidator> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const isMountedRef = useRef(false);
${d.searchParamsLine}
  // Initialize lastFetchedAt on mount to prevent hydration errors
  // This ensures the initial value is consistent between server and client
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      setLastFetchedAt(Date.now());
    }
  }, []);

  useEffect(() => {
    // Skip fetch if lastFetchedAt hasn't been initialized yet
    if (lastFetchedAt === null) {
      return;
    }

    let isCleandUp = false;
    const thisLastFetchedAt = lastFetchedAt;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchData = async () => {
      // reset the states
      setLoading(true);
      setError(null);
      setData(null);

      const combinedSignal = AbortSignal.any([
        abortController.signal,
        AbortSignal.timeout(1_000 * 5), // 5 seconds timeout
      ]);
      const url = window.location.protocol + "//" + window.location.host;
${d.fetchUrlCode}
      try {
        const response = await fetch(fetchURL, {
          signal: combinedSignal,
        });
        const data = await response.json();

        if (!isCleandUp && lastFetchedAt === thisLastFetchedAt) {
          setData(data);
          setLoading(false);
          setError(null);
        }
      } catch (error: unknown) {
        if (!isCleandUp) {
          setLoading(false);

          if (error instanceof Error && error.name === "TimeoutError") {
            setError("Timeout: It took more than 5 seconds to get the result!");
          }
          if (error instanceof Error && error.name === "AbortError") {
            setError(\`Fetch canceled by user\`);
          }
        }
      }
    };

    fetchData();

    return () => {
      isCleandUp = true;
      abortController.abort();
      abortControllerRef.current = null;
    };
  }, [${d.effectDeps}]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const refetch = useCallback(() => {
    // abort the current fetch
    abortControllerRef.current?.abort();
    // set the last fetched at to the current time
    setLastFetchedAt(Date.now());
  }, []);

  return useMemo(
    () => ({ data, error, isLoading, cancel, refetch, lastFetchedAt }),
    [data, error, isLoading, cancel, refetch, lastFetchedAt]
  );
};
`;
}
