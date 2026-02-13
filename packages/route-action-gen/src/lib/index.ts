import { z } from "zod";

/**
 * A helper function to create a request validator object.
 * @param body - The body schema using Zod.
 * @param params - The params schema using Zod.
 * @param headers - The headers schema using Zod.
 * @param user - The auth function to authorize the request.
 * @param searchParams - The search params schema using Zod.
 * @returns The request validator object.
 */
export const createRequestValidator = <
  TBody extends z.ZodType,
  TParams extends z.ZodType,
  THeaders extends z.ZodType,
  TSearchParams extends z.ZodType,
  TUser,
>({
  body,
  params,
  headers,
  user,
  searchParams,
}: {
  body?: TBody;
  params?: TParams;
  headers?: THeaders;
  user?: AuthFunc<TUser>;
  searchParams?: TSearchParams;
}) => {
  return {
    body,
    params,
    headers,
    user,
    searchParams,
  };
};

/**
 * The auth function to authorize the request.
 * Implementation details:
 * - If the request is authenticated, return the user object.
 * - If the request is not authenticated but you want to allow it to continue, return null.
 * - If you want to reject the request, throw an error. Returning null means the end point accepts both authenticated and unauthenticated requests.
 * @param request - The request object
 * @returns The user object if the request is authenticated, null if the request is not authenticated but you want to allow it to continue, or an error if you want to reject the request.
 */
export type AuthFunc<TUser> = (request?: Request) => Promise<TUser>;

export type SuccessResponse<TResponse extends z.ZodType, Input> = {
  status: true;
  statusCode: number;
  data: z.infer<TResponse>;
  input?: Input | null;
};

export type ErrorResponse = {
  status: false;
  statusCode: number;
  message: string;
  object?: Record<string, any>;
};

export type HandlerResponse<TResponse extends z.ZodType, Input> =
  | SuccessResponse<TResponse, Input>
  | ErrorResponse;

/**
 * A helper function to create a success response object.
 * @param data - The data to return in the response.
 * @param input - The input data if the request validator defines the input.
 * @returns The success response object.
 */
export const successResponse = <TResponse extends z.ZodType, Input>(
  data: z.infer<TResponse>,
  input?: Input | null
): SuccessResponse<TResponse, Input> => {
  return {
    status: true,
    statusCode: 200,
    data,
    input,
  };
};

/**
 * A helper function to create an error response object.
 * @param message - The message to return in the response.
 * @param object - The object to return in the response.
 * @param statusCode - The status code to return in the response.
 * @returns The error response object.
 */
export const errorResponse = (
  message: string,
  object?: Record<string, any>,
  statusCode: number = 500
): ErrorResponse => {
  return {
    status: false,
    statusCode,
    message,
    object,
  };
};

type ExtractValidatorData<TValidator> = TValidator extends {
  body?: infer TBody;
  params?: infer TParams;
  headers?: infer THeaders;
  user?: infer TUser;
  searchParams?: infer TSearchParams;
}
  ? (TBody extends z.ZodType
      ? { body: z.infer<TBody> }
      : Record<string, never>) &
      (TParams extends z.ZodType
        ? { params: z.infer<TParams> }
        : Record<string, never>) &
      (THeaders extends z.ZodType
        ? { headers: z.infer<THeaders> }
        : Record<string, never>) &
      (TUser extends AuthFunc<infer TUserType>
        ? { user: TUserType }
        : Record<string, never>) &
      (TSearchParams extends z.ZodType
        ? { searchParams: z.infer<TSearchParams> }
        : Record<string, never>)
  : never;

/**
 * A generic type that represents the handler function. Use this type in the exported handler function to ensure the function is strongly typed.
 * @param validator - The request validator object.
 * @param response - The response schema using Zod.
 * @param input - The input data if the request validator defines the input.
 * @example
 * export const handler: HandlerFunc<typeof requestValidator, typeof responseValidator, undefined> = async (data) => {
 *   const { body, params, user } = data;
 *   const post = await getPost(params.postId);
 *   if (!post) {
 *     return errorResponse("Post not found", undefined, 404);
 *   }
 *   return successResponse({ id: post.id });
 * };
 * @returns The handler response object.
 */
export type HandlerFunc<
  TValidator extends ReturnType<typeof createRequestValidator>,
  TResponse extends z.ZodType,
  Input,
> = (
  data: ExtractValidatorData<TValidator>
) => Promise<HandlerResponse<TResponse, Input>>;

/**
 * A validation error.
 *
 * @param name - The name of the field that is invalid
 * @param message - The message of the validation error
 * @param code - The code of the validation error
 */
export type ValidationError = {
  name: string;
  message: string;
  code: string;
};

/**
 * Maps a Zod error to a validation error.
 *
 * @param error - The Zod error to map
 * @returns A validation error
 */
export const mapZodError = (error: z.ZodError): ValidationError[] => {
  return error.errors.map((e) => ({
    name: e.path.join("."),
    message: e.message,
    code: `validation:${e.code}`,
  }));
};
