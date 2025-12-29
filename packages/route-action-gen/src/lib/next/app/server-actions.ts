import z from "zod";

import { createRequestValidator, HandlerFunc, HandlerResponse } from "../..";
import { processFormAction, processServerFunction } from "../process.js";

/**
 * Creates a form action function that wraps the action function with the admin auth and validator functions.
 * The action function is wrapped with the admin auth function to ensure that the user is authenticated and has the required role.
 * The action function is wrapped with the validator function to ensure that the input data is valid.
 * The form action function is then returned.
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
 * Creates a server function that wraps the action function with the auth and validator functions.
 * The action function is wrapped with the auth function to ensure that the user is authenticated.
 * The action function is wrapped with the validator function to ensure that the input data is valid.
 * The server function is then returned.
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
