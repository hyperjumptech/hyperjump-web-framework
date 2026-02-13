import { z } from "zod";
import {
  AuthFunc,
  createRequestValidator,
  successResponse,
  errorResponse,
  HandlerFunc,
} from "route-action-gen/lib";
import { getUserById, User } from "@/models/user";
import { getPostById, updatePostById } from "@/models/post";

// The body validator
const bodyValidator = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

// The dyanamic params validator
const paramsValidator = z.object({
  postId: z.string().min(1),
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
  const post = await getPostById(params.postId);
  if (!post) {
    return errorResponse("Post not found", undefined, 404);
  }
  if (post.userId !== user.id) {
    return errorResponse(
      "User does not have permission to update this post",
      undefined,
      403,
    );
  }

  await updatePostById(params.postId, {
    title: body.title,
    content: body.content,
  });

  return successResponse({ id: post.id });
};
