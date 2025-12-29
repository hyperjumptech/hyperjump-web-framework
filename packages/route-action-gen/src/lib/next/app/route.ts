import { createRequestValidator, HandlerFunc } from "../..";
import { z } from "zod";
import { processRequest } from "../process";

/**
 * Create a route handler for Next.js App Router.
 * @param requestValidator
 * @param responseValidator
 * @param handler
 * @returns A route handler function.
 */
export const createRoute = <TResponse extends z.ZodType, Input>(
  requestValidator: ReturnType<typeof createRequestValidator>,
  responseValidator: TResponse,
  handler: HandlerFunc<typeof requestValidator, TResponse, Input>
) => {
  return async (request: Request, context?: any) => {
    const processFunc = processRequest(
      requestValidator,
      responseValidator,
      handler
    );
    const params = await context?.params;
    const response = await processFunc(request, params);
    return response;
  };
};
