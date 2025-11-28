"use server";

import { getUser } from "./user";
import { getPostByIdAndUser, updatePost } from "./post";
import { revalidatePath } from "next/cache";

export const toggleFavorite = async (postId: string) => {
  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const user = await getUser();
  if (!user) {
    return {
      ok: 0,
      error: "user not found",
    };
  }
  const post = await getPostByIdAndUser(postId, user.id);
  if (!post) {
    return {
      ok: 0,
      error: "Post not found",
    };
  }
  await updatePost(postId, user.id, !post.isFavorite);

  //refresh();
  revalidatePath("/updating-data");

  return {
    ok: 1,
    message: "Post toggled successfully",
  };
};
