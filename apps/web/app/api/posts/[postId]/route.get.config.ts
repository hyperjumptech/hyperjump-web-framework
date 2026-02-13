import {
  AuthFunc,
  createRequestValidator,
  HandlerFunc,
  errorResponse,
  successResponse,
} from "route-action-gen/lib";
import { getUserById, User } from "@/models/user";
import { z } from "zod";
import { getPostById } from "@/models/post";

const auth: AuthFunc<User> = async () => {
  const user = await getUserById("1");
  if (!user) throw new Error("Unauthorized");
  return user;
};

const paramsValidator = z.object({
  postId: z.string().min(1),
});

export const requestValidator = createRequestValidator({
  user: auth,
  params: paramsValidator,
});

export const responseValidator = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator,
  undefined
> = async (data) => {
  const { params } = data;
  const post = await getPostById(params.postId);
  if (!post) {
    return errorResponse("Post not found", undefined, 404);
  }
  return successResponse({
    id: post.id,
    title: post.title,
    content: post.content,
  });
};
