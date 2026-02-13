import z from "zod";

import {
  createRequestValidator,
  HandlerFunc,
  HandlerResponse,
} from "../../index.js";
import { processFormAction, processServerFunction } from "../process.js";

/**
 * Extracts the payload type for server functions from a request validator.
 * This type excludes 'user' and 'headers' (handled internally) and makes
 * 'body' and 'params' required when they exist in the validator.
 */
type ExtractServerFunctionPayload<TValidator> = TValidator extends {
  body?: infer TBody;
  params?: infer TParams;
  searchParams?: infer TSearchParams;
}
  ? (TBody extends z.ZodType
      ? { body: z.infer<TBody> }
      : Record<string, never>) &
      (TParams extends z.ZodType
        ? { params: z.infer<TParams> }
        : Record<string, never>) &
      (TSearchParams extends z.ZodType
        ? { searchParams?: z.infer<TSearchParams> }
        : Record<string, never>)
  : never;

/**
 * Creates a form action function for Next.js Form Actions which can called from the client component using useActionState hook.
 * @see https://nextjs.org/docs/app/getting-started/updating-data#showing-a-pending-state
 *
 * @example
 *
 * @param validator - The Zod validator for the action
 * @param action - The action function to be wrapped
 * @param role - The role of the user
 * @param prisma - The Prisma client
 * @returns A form action function
 */
export function createFormAction<
  TValidator extends ReturnType<typeof createRequestValidator>,
  TResponse extends z.ZodType,
  Input,
>(
  requestValidator: TValidator,
  responseValidator: TResponse,
  handler: HandlerFunc<TValidator, TResponse, Input>,
) {
  return async (
    _state: Awaited<ReturnType<typeof handler>> | null,
    formData: FormData,
  ): Promise<Awaited<ReturnType<typeof handler>> | null> => {
    const processFunc = processFormAction(
      requestValidator,
      responseValidator,
      handler,
    );

    const response = await processFunc(formData);
    return response as Awaited<ReturnType<typeof handler>> | null;
  };
}

/**
 * Creates a server function for Next.js Server Functions.
 *
 * @example
 */
export function createServerFunction<
  TValidator extends ReturnType<typeof createRequestValidator>,
  TResponse extends z.ZodType,
  Input,
>(
  requestValidator: TValidator,
  responseValidator: TResponse,
  handler: HandlerFunc<TValidator, TResponse, Input>,
) {
  return async (
    payload: ExtractServerFunctionPayload<TValidator>,
  ): Promise<HandlerResponse<TResponse, Input | null>> => {
    const processFunc = processServerFunction(
      requestValidator,
      responseValidator,
      handler,
    );
    const response = await processFunc(payload);
    return response;
  };
}
