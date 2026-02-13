import {
  createRequestValidator,
  HandlerFunc,
  errorResponse,
  AuthFunc,
} from "../../index.js";
import { z } from "zod";

type RequestValidator = ReturnType<typeof createRequestValidator>;

interface MethodConfig {
  requestValidator: RequestValidator;
  responseValidator: z.ZodType;
  handler: HandlerFunc<any, any, any>;
}

/**
 * Authenticate the user using the auth function from the request validator.
 * In Pages Router, the raw request is not a Web `Request`, so we call auth()
 * without arguments.
 */
const authenticateUser = async (
  auth: AuthFunc<any> | undefined,
): Promise<{ user: any } | { error: ReturnType<typeof errorResponse> }> => {
  if (!auth) {
    return { user: null };
  }

  try {
    const user = await auth();
    return { user };
  } catch (error) {
    return { error: errorResponse("Unauthorized", undefined, 401) };
  }
};

/**
 * Validate a value against a Zod schema, returning null if no validator is provided.
 */
const validate = async (
  validator: z.ZodType | undefined,
  value: any,
): Promise<any> => {
  if (!validator || value == null) {
    return null;
  }
  return await validator.parseAsync(value);
};

/**
 * Validate headers from a Node.js IncomingMessage-style headers object.
 */
const validateNodeHeaders = async (
  headersValidator: z.ZodType | undefined,
  rawHeaders: Record<string, string | string[] | undefined>,
): Promise<any> => {
  if (!headersValidator) {
    return null;
  }

  // Normalize headers to Record<string, string>, taking the first value for arrays
  const headersObj: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (value !== undefined) {
      headersObj[key.toLowerCase()] = Array.isArray(value) ? value[0]! : value;
    }
  }
  return await headersValidator.parseAsync(headersObj);
};

/**
 * Split `req.query` into params (dynamic segments) and searchParams (query string).
 *
 * In Next.js Pages Router, both dynamic route segments and query string parameters
 * are merged into `req.query`. We use the `paramNames` list to separate them.
 *
 * @param query - The combined query object from `req.query`
 * @param paramNames - Names of dynamic route segments (e.g. ["postId"])
 * @returns An object with `params` and `searchParams`
 */
const splitQuery = (
  query: Record<string, string | string[] | undefined>,
  paramNames: string[],
): { params: Record<string, string>; searchParams: Record<string, string> } => {
  const paramSet = new Set(paramNames);
  const params: Record<string, string> = {};
  const searchParams: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    const strValue = Array.isArray(value) ? value[0]! : value;

    if (paramSet.has(key)) {
      params[key] = strValue;
    } else {
      searchParams[key] = strValue;
    }
  }

  return { params, searchParams };
};

/**
 * Create a Next.js Pages Router API route handler.
 *
 * Returns a default-export-compatible handler that dispatches to the correct
 * method handler based on `req.method`, validates the request, and sends a
 * JSON response via `res.status().json()`.
 *
 * @param methods - Map of HTTP method -> { requestValidator, responseValidator, handler }
 * @param paramNames - Names of dynamic route segments used to split `req.query`
 * @returns A Pages Router API handler function
 *
 * @example
 * ```ts
 * export default createPagesRoute(
 *   {
 *     get: { requestValidator: getReqVal, responseValidator: getResVal, handler: getHandler },
 *     post: { requestValidator: postReqVal, responseValidator: postResVal, handler: postHandler },
 *   },
 *   ["postId"],
 * );
 * ```
 */
export const createPagesRoute = (
  methods: Partial<Record<string, MethodConfig>>,
  paramNames: string[] = [],
) => {
  return async (
    req: {
      method?: string;
      body?: any;
      query: Record<string, string | string[] | undefined>;
      headers: Record<string, string | string[] | undefined>;
    },
    res: {
      status: (code: number) => { json: (body: any) => void; end: () => void };
    },
  ): Promise<void> => {
    const method = req.method?.toLowerCase();
    if (!method) {
      res.status(405).json({ message: "Method not allowed" });
      return;
    }

    const config = methods[method];
    if (!config) {
      res.status(405).json({
        message: `Method ${req.method} not allowed`,
      });
      return;
    }

    const { requestValidator, handler } = config;
    const {
      body: bodyValidator,
      params: paramsValidator,
      headers: headersValidator,
      user: auth,
      searchParams: searchParamsValidator,
    } = requestValidator;

    try {
      // Authenticate
      const authResult = await authenticateUser(auth);
      if ("error" in authResult) {
        const err = authResult.error;
        res.status(err.statusCode).json({
          message: err.message,
          statusCode: err.statusCode,
        });
        return;
      }
      const { user } = authResult;

      // Split req.query into params and searchParams
      const { params: rawParams, searchParams: rawSearchParams } = splitQuery(
        req.query,
        paramNames,
      );

      // Determine if this method has a body
      const isBodyMethod =
        method === "post" || method === "put" || method === "patch";

      // Validate in parallel
      const [
        validatedBody,
        validatedHeaders,
        validatedParams,
        validatedSearchParams,
      ] = await Promise.all([
        isBodyMethod
          ? validate(bodyValidator, req.body)
          : Promise.resolve(null),
        validateNodeHeaders(headersValidator, req.headers),
        validate(paramsValidator, rawParams),
        validate(searchParamsValidator, rawSearchParams),
      ]);

      const data = {
        body: validatedBody,
        headers: validatedHeaders,
        params: validatedParams,
        searchParams: validatedSearchParams,
        user,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await handler(data as any);

      if (response.status === false) {
        res.status(response.statusCode).json({
          message: response.message,
          statusCode: response.statusCode,
        });
        return;
      }

      res.status(response.statusCode).json(response.data);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Validation error",
          statusCode: 400,
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Internal server error",
        statusCode: 500,
      });
    }
  };
};
