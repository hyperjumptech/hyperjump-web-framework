import { z } from "zod";
import {
  AuthFunc,
  createRequestValidator,
  successResponse,
  errorResponse,
  HandlerFunc,
} from "route-action-gen/lib";
import { getUserById, updateUser, User } from "@/models/user";

// The body validator
const bodyValidator = z.object({
  name: z.string().min(1),
});

// The dyanamic params validator
const paramsValidator = z.object({
  userId: z.string().min(1),
});

// The auth function to authorize the request
const auth: AuthFunc<User> = async () => {
  const user = await getUserById("1");
  if (!user) throw new Error("Unauthorized");
  return user;
};

// The request validator which combines all the validators
export const requestValidator = createRequestValidator({
  body: bodyValidator,
  params: paramsValidator,
  user: auth,
});

// The response validator to validate the response
export const responseValidator = z.object({
  id: z.string().min(1),
});

// The handler function to handle the request
export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  const { body, params, user } = data;
  const userData = await getUserById(params.userId);
  if (!userData) {
    return errorResponse("User not found", undefined, 404);
  }
  if (userData.id !== user.id) {
    return errorResponse(
      "User does not have permission to update this user",
      undefined,
      403,
    );
  }

  await updateUser(params.userId, {
    name: body.name,
  });

  return successResponse({ id: user.id });
};

// Next.js Pages Router requires a default export for all files under pages/api/.
// This is a no-op handler to satisfy the ApiRouteConfig type constraint.
export default function _noop() {}
