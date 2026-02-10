/**
 * Stub config for delete-with-params fixtures.
 * This file exists so the editor can resolve imports in generated fixture snapshots.
 * It is NOT used at runtime or during tests.
 */
import { z } from "zod";
import {
  createRequestValidator,
  type HandlerFunc,
  successResponse,
} from "route-action-gen/lib";

export const requestValidator = createRequestValidator({
  params: z.object({ postId: z.string().min(1) }),
});

export const responseValidator = z.object({
  success: z.boolean(),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async () => {
  return successResponse({ success: true });
};
