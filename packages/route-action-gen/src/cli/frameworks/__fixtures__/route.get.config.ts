/**
 * Stub config for get-with-params fixtures.
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
  id: z.string().min(1),
  title: z.string(),
  content: z.string(),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async () => {
  return successResponse({ id: "1", title: "Test", content: "Content" });
};
