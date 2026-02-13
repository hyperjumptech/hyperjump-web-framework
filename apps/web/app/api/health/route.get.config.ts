import {
  createRequestValidator,
  type HandlerFunc,
  successResponse,
} from "route-action-gen/lib";
import { z } from "zod";
import { getTotalUsers } from "@/models/user";

export const requestValidator = createRequestValidator({});

export const responseValidator = z.object({
  totalUsers: z.number(),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async () => {
  const totalUsers = await getTotalUsers();
  return successResponse({ totalUsers });
};
