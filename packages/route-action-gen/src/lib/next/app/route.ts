import { createRequestValidator, HandlerFunc } from "../../index.js";
import { z } from "zod";
import { processRequest } from "../process.js";

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
  handler: HandlerFunc<typeof requestValidator, TResponse, Input>,
): ((request: Request, context?: any) => Promise<Response>) => {
  return async (request: Request, context?: any) => {
    const processFunc = processRequest(
      requestValidator,
      responseValidator,
      handler,
    );
    const params = await context?.params;
    const response = await processFunc(request, params);

    if (response.status === false) {
      return new Response(
        JSON.stringify({
          message: response.message,
          statusCode: response.statusCode,
        }),
        {
          status: response.statusCode,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(response.data), {
      status: response.statusCode,
    });
  };
};
