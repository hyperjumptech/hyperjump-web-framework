/**
 * Stub config for post-with-body-params-auth fixtures.
 * This file exists so the editor can resolve imports in generated fixture snapshots.
 * It is NOT used at runtime or during tests.
 */
import { z } from "zod";
import {
  createRequestValidator,
  type AuthFunc,
  type HandlerFunc,
  successResponse,
} from "route-action-gen/lib";

const auth: AuthFunc<{ id: string }> = async () => {
  return { id: "user-1" };
};

export const requestValidator = createRequestValidator({
  body: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
  }),
  params: z.object({ postId: z.string().min(1) }),
  user: auth,
});

export const responseValidator = z.object({
  id: z.string().min(1),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async () => {
  return successResponse({ id: "1" });
};
