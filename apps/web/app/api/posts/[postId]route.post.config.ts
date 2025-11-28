import { z } from "zod";
import {
  AuthFunc,
  createRequestValidator,
  successResponse,
  errorResponse,
  HandlerFunc,
} from "../../route-next-gen-lib";
import { getUser, User } from "./user";
import { getPost, updatePost } from "./post";

const bodyValidator = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const paramsValidator = z.object({
  postId: z.string().min(1),
});

const auth: AuthFunc<User> = async (request: Request) => {
  const user = await getUser(request);
  if (!user) throw new Error("Unauthorized");
  return user;
};

export const requestValidator = createRequestValidator({
  body: bodyValidator,
  params: paramsValidator,
  user: auth,
});

export const responseValidator = z.object({
  id: z.string().min(1),
});

export const handler: HandlerFunc<
  typeof requestValidator,
  typeof responseValidator
> = async (data) => {
  const { body, params, user } = data;
  const post = await getPost(params.postId);
  if (!post) {
    return errorResponse(404, "Post not found");
  }
  if (post.userId !== user.id) {
    return errorResponse(
      403,
      "User does not have permission to update this post"
    );
  }

  await updatePost(params.postId, {
    title: body.title,
    content: body.content,
  });

  return successResponse(200, { id: post.id });
};
