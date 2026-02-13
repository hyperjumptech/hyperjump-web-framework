import {
  AuthFunc,
  createRequestValidator,
  HandlerFunc,
  errorResponse,
  successResponse,
} from "route-action-gen/lib";
import { getUserById, User } from "@/models/user";
import { z } from "zod";

const auth: AuthFunc<User> = async () => {
  const user = await getUserById("1");
  if (!user) throw new Error("Unauthorized");
  return user;
};

export const requestValidator = createRequestValidator({
  user: auth,
  params: z.object({
    userId: z.string().min(1),
  }),
});

export const responseValidator = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  const { params } = data;
  const user = await getUserById(params.userId);
  if (!user) {
    return errorResponse("User not found", undefined, 404);
  }
  return successResponse({
    id: user.id,
    name: user.name ?? "",
  });
};

// Next.js Pages Router requires a default export for all files under pages/api/.
// This is a no-op handler to satisfy the ApiRouteConfig type constraint.
export default function _noop() {}
