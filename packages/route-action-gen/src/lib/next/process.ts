import { headers } from "next/headers";
import {
  createRequestValidator,
  HandlerFunc,
  errorResponse,
  AuthFunc,
} from "../index.js";
import { z } from "zod";
import { parseFormData } from "../node/form-data.js";

type RequestValidator = ReturnType<typeof createRequestValidator>;

const authenticateUser = async (
  auth: AuthFunc<any> | undefined,
  request?: Request,
): Promise<{ user: any } | { error: ReturnType<typeof errorResponse> }> => {
  if (!auth) {
    return { user: null };
  }

  try {
    const user = request ? await auth(request) : await auth();
    return { user };
  } catch (error) {
    return { error: errorResponse("Unauthorized", undefined, 401) };
  }
};

const validateHeaders = async (
  headersValidator: z.ZodType | undefined,
  headersSource: Headers,
): Promise<any> => {
  if (!headersValidator) {
    return null;
  }

  const headersObj: Record<string, string> = {};
  for (const [key, value] of headersSource.entries()) {
    headersObj[key.toLowerCase()] = value;
  }
  return await headersValidator.parseAsync(headersObj);
};

const validateHeadersFromNext = async (
  headersValidator: z.ZodType | undefined,
): Promise<any> => {
  if (!headersValidator) {
    return null;
  }

  const headersStore = await headers();
  return validateHeaders(headersValidator, headersStore);
};

const parseRequestBody = async (request: Request): Promise<any> => {
  const requestType = request.headers.get("content-type");

  if (requestType?.includes("application/json")) {
    return await request.json();
  }

  if (
    requestType?.includes("application/x-www-form-urlencoded") ||
    requestType?.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  if (requestType?.includes("text/plain")) {
    return await request.text();
  }

  return null;
};

const validateBodyFromRequest = async (
  bodyValidator: z.ZodType | undefined,
  request: Request,
): Promise<any> => {
  const method = request?.method?.toLowerCase();
  const isBodyMethod =
    method === "post" || method === "put" || method === "patch";

  if (!bodyValidator || !isBodyMethod) {
    return null;
  }

  const requestBody = await parseRequestBody(request);
  return await bodyValidator.parseAsync(requestBody);
};

const validateBodyFromPayload = async (
  bodyValidator: z.ZodType | undefined,
  payload: any,
): Promise<any> => {
  if (!bodyValidator) {
    return null;
  }

  return await bodyValidator.parseAsync(payload);
};

const validateParams = async (
  paramsValidator: z.ZodType | undefined,
  params: any,
): Promise<any> => {
  if (!paramsValidator || !params) {
    return null;
  }

  return await paramsValidator.parseAsync(params);
};

const validateSearchParamsFromRequest = async (
  searchParamsValidator: z.ZodType | undefined,
  request: Request,
): Promise<any> => {
  if (!searchParamsValidator) {
    return null;
  }

  const url = new URL(request.url);
  const searchParamsObj: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    searchParamsObj[key] = value;
  }
  return await searchParamsValidator.parseAsync(searchParamsObj);
};

/**
 * Process a request and return a response. This is used to process a request for a Next.js App Router route.
 * @param requestValidator
 * @param responseValidator
 * @param handler
 * @returns A response object.
 */
export const processRequest =
  (
    requestValidator: RequestValidator,
    responseValidator: z.ZodType,
    handler: HandlerFunc<
      typeof requestValidator,
      typeof responseValidator,
      any
    >,
  ) =>
  async (request: Request, params?: any) => {
    const {
      body: bodyValidator,
      params: paramsValidator,
      headers: headersValidator,
      user: auth,
      searchParams: searchParamsValidator,
    } = requestValidator;

    const authResult = await authenticateUser(auth, request);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const [
      validatedBody,
      validatedHeaders,
      validatedParams,
      validatedSearchParams,
    ] = await Promise.all([
      validateBodyFromRequest(bodyValidator, request),
      validateHeaders(headersValidator, request.headers),
      validateParams(paramsValidator, params),
      validateSearchParamsFromRequest(searchParamsValidator, request),
    ]);

    const data = {
      body: validatedBody,
      headers: validatedHeaders,
      params: validatedParams,
      searchParams: validatedSearchParams,
      user,
    };

    return await handler(data);
  };

/**
 * Process a form action and return a response. This is used to process a form action for a Next.js Form Actions. Only body and headers are validated.
 * @param requestValidator
 * @param responseValidator
 * @param handler
 * @returns A response object.
 */
export const processFormAction =
  (
    requestValidator: RequestValidator,
    responseValidator: z.ZodType,
    handler: HandlerFunc<
      typeof requestValidator,
      typeof responseValidator,
      any
    >,
  ) =>
  async (formData: FormData | null) => {
    const {
      body: bodyValidator,
      user: auth,
      headers: headersValidator,
      searchParams: searchParamsValidator,
      params: paramsValidator,
    } = requestValidator;

    const authResult = await authenticateUser(auth);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const formDataObj = formData ? parseFormData(formData) : {};

    const [
      validatedBody,
      validatedHeaders,
      validatedSearchParams,
      validatedParams,
    ] = await Promise.all([
      validateBodyFromPayload(bodyValidator, formDataObj["body"]),
      validateHeadersFromNext(headersValidator),
      validateParams(searchParamsValidator, formDataObj["searchParams"]),
      validateParams(paramsValidator, formDataObj["params"]),
    ]);

    const data = {
      body: validatedBody,
      params: validatedParams,
      headers: validatedHeaders,
      searchParams: validatedSearchParams,
      user,
    };

    return await handler(data);
  };

/**
 * Process a server function and return a response. This is used to process a server function for a Next.js Server Functions. Only body, params and search params are validated.
 * @param requestValidator
 * @param responseValidator
 * @param handler
 * @returns A response object.
 */
export const processServerFunction =
  (
    requestValidator: RequestValidator,
    responseValidator: z.ZodType,
    handler: HandlerFunc<
      typeof requestValidator,
      typeof responseValidator,
      any
    >,
  ) =>
  async (payload: {
    body?: z.infer<NonNullable<typeof requestValidator.body>>;
    params?: z.infer<NonNullable<typeof requestValidator.params>>;
    searchParams?: z.infer<NonNullable<typeof requestValidator.searchParams>>;
  }) => {
    const {
      body: bodyValidator,
      user: auth,
      headers: headersValidator,
      params: paramsValidator,
      searchParams: searchParamsValidator,
    } = requestValidator;

    const authResult = await authenticateUser(auth);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const [
      validatedBody,
      validatedHeaders,
      validatedParams,
      validatedSearchParams,
    ] = await Promise.all([
      validateBodyFromPayload(bodyValidator, payload.body),
      validateHeadersFromNext(headersValidator),
      validateParams(paramsValidator, payload.params),
      validateSearchParamsFromRequest(
        searchParamsValidator,
        payload.searchParams,
      ),
    ]);

    const data = {
      body: validatedBody,
      params: validatedParams,
      headers: validatedHeaders,
      searchParams: validatedSearchParams,
      user,
    };

    return await handler(data);
  };
