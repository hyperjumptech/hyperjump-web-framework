import { z } from "zod";
import {
  AuthFunc,
  createRequestValidator,
  successResponse,
  HandlerFunc,
} from "route-action-gen/lib";
import { getUserById, createUser, User } from "@/models/user";

// The body validator
const bodyValidator = z.object({
  name: z.string().min(1),
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
  const { body } = data;
  const newUser = await createUser({
    name: body.name,
  });
  return successResponse({ id: newUser.id });
};
