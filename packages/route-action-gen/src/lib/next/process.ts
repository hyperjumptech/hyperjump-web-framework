import { headers } from "next/headers";
import { createRequestValidator, HandlerFunc, errorResponse } from "..";
import { z } from "zod";

export const processRequest =
  (
    requestValidator: ReturnType<typeof createRequestValidator>,
    responseValidator: z.ZodType,
    handler: HandlerFunc<typeof requestValidator, typeof responseValidator, any>
  ) =>
  async (request: Request, params?: any) => {
    const {
      body: bodyValidator,
      params: paramsValidator,
      headers: headersValidator,
      user: auth,
      searchParams: searchParamsValidator,
    } = requestValidator;

    let user: any = null;
    if (auth) {
      try {
        user = await auth(request);
      } catch (error) {
        return errorResponse("Unauthorized", undefined, 401);
      }
    }

    const method = request?.method;
    const [
      validatedBody,
      validatedHeaders,
      validatedParams,
      validatedSearchParams,
    ] = await Promise.all([
      new Promise(async (resolve) => {
        if (
          method &&
          (method.toLowerCase() === "post" ||
            method.toLowerCase() === "put" ||
            method.toLowerCase() === "patch")
        ) {
          if (bodyValidator) {
            const requestType = request.headers.get("content-type");
            let requestBody: any = null;
            if (requestType?.includes("application/json")) {
              requestBody = await request.json();
            } else if (
              requestType?.includes("application/x-www-form-urlencoded")
            ) {
              const formData = await request.formData();
              requestBody = Object.fromEntries(formData.entries());
            } else if (requestType?.includes("multipart/form-data")) {
              const formData = await request.formData();
              requestBody = Object.fromEntries(formData.entries());
            } else if (requestType?.includes("text/plain")) {
              requestBody = await request.text();
            }
            resolve(await bodyValidator.parseAsync(requestBody));
          } else {
            resolve(null);
          }
        }
      }),
      new Promise(async (resolve) => {
        if (headersValidator) {
          const headersObj: Record<string, string> = {};
          for (const [key, value] of request.headers.entries()) {
            headersObj[key.toLowerCase()] = value;
          }
          resolve(await headersValidator.parseAsync(headersObj));
        } else {
          resolve(null);
        }
      }),
      new Promise(async (resolve) => {
        if (paramsValidator) {
          if (params) {
            resolve(await paramsValidator.parseAsync(params));
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      }),
      new Promise(async (resolve) => {
        if (searchParamsValidator) {
          const url = new URL(request.url);
          const searchParamsObj: Record<string, string> = {};
          for (const [key, value] of url.searchParams.entries()) {
            searchParamsObj[key] = value;
          }
          resolve(await searchParamsValidator.parseAsync(searchParamsObj));
        } else {
          resolve(null);
        }
      }),
    ]);

    const data = {
      body: validatedBody,
      headers: validatedHeaders,
      params: validatedParams,
      searchParams: validatedSearchParams,
      user,
    };

    const response = await handler(data);
    return response;
  };

export const processFormAction =
  (
    requestValidator: ReturnType<typeof createRequestValidator>,
    responseValidator: z.ZodType,
    handler: HandlerFunc<typeof requestValidator, typeof responseValidator, any>
  ) =>
  async (formData: FormData | null) => {
    const {
      body: bodyValidator,
      user: auth,
      headers: headersValidator,
    } = requestValidator;

    let user: any = null;
    if (auth) {
      try {
        user = await auth();
      } catch (error) {
        return errorResponse("Unauthorized", undefined, 401);
      }
    }

    const [validatedBody, validatedHeaders] = await Promise.all([
      new Promise(async (resolve) => {
        if (bodyValidator && formData) {
          resolve(
            await bodyValidator.parseAsync(
              Object.fromEntries(formData.entries())
            )
          );
        } else {
          resolve(null);
        }
      }),
      new Promise(async (resolve) => {
        if (headersValidator) {
          const headersObj: Record<string, string> = {};
          const headersStore = await headers();
          for (const [key, value] of headersStore.entries()) {
            headersObj[key.toLowerCase()] = value;
          }
          resolve(await headersValidator.parseAsync(headersObj));
        } else {
          resolve(null);
        }
      }),
    ]);

    const data = {
      body: validatedBody,
      params: null,
      headers: validatedHeaders,
      searchParams: null,
      user,
    };

    const response = await handler(data);
    return response;
  };

export const processServerFunction =
  (
    requestValidator: ReturnType<typeof createRequestValidator>,
    responseValidator: z.ZodType,
    handler: HandlerFunc<typeof requestValidator, typeof responseValidator, any>
  ) =>
  async (payload: any) => {
    const {
      body: bodyValidator,
      user: auth,
      headers: headersValidator,
    } = requestValidator;

    let user: any = null;
    if (auth) {
      try {
        user = await auth();
      } catch (error) {
        return errorResponse("Unauthorized", undefined, 401);
      }
    }

    const [validatedBody, validatedHeaders] = await Promise.all([
      new Promise(async (resolve) => {
        if (bodyValidator) {
          resolve(await bodyValidator.parseAsync(payload));
        } else {
          resolve(null);
        }
      }),
      new Promise(async (resolve) => {
        if (headersValidator) {
          const headersObj: Record<string, string> = {};
          const headersStore = await headers();
          for (const [key, value] of headersStore.entries()) {
            headersObj[key.toLowerCase()] = value;
          }
          resolve(await headersValidator.parseAsync(headersObj));
        } else {
          resolve(null);
        }
      }),
    ]);

    const data = {
      body: validatedBody,
      params: null,
      headers: validatedHeaders,
      searchParams: null,
      user,
    };

    const response = await handler(data);
    return response;
  };
