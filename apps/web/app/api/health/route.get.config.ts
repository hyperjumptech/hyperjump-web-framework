import { z } from "zod";
import {
  createRequestValidator,
  HandlerFunc,
  successResponse,
} from "route-action-gen/lib";

export const requestValidator = createRequestValidator({});

export const responseValidator = z.object({
  status: z.string(),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async () => {
  return successResponse({
    status: "ok",
  });
};
