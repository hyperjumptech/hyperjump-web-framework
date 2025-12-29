import z from "zod";

import { createRequestValidator, HandlerFunc, HandlerResponse } from "../..";
import { processFormAction, processServerFunction } from "../process.js";

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
export function createFormAction(
  requestValidator: ReturnType<typeof createRequestValidator>,
  responseValidator: z.ZodType,
  handler: HandlerFunc<typeof requestValidator, typeof responseValidator, any>
) {
  return async <State extends Awaited<ReturnType<typeof handler>> | null>(
    _state: State,
    payload: FormData | null
  ): Promise<State> => {
    const processFunc = processFormAction(
      requestValidator,
      responseValidator,
      handler
    );

    const response = await processFunc(payload);
    return response as State;
  };
}

/**
 * Creates a server function for Next.js Server Functions.
 *
 * @example
 */
export function createServerFunction<TResponse extends z.ZodType, Input>(
  requestValidator: ReturnType<typeof createRequestValidator>,
  responseValidator: TResponse,
  handler: HandlerFunc<typeof requestValidator, TResponse, Input>
) {
  return async (
    payload: Input
  ): Promise<HandlerResponse<TResponse, Input | null>> => {
    const processFunc = processServerFunction(
      requestValidator,
      responseValidator,
      handler
    );
    const response = await processFunc(payload);
    return response as HandlerResponse<TResponse, Input>;
  };
}
