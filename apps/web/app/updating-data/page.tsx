import { notFound } from "next/navigation";
import { getPostByIdAndUser } from "./post";
import { ToggleFavorite } from "./toggle-favorite.client";

export default async function Page() {
  const post = await getPostByIdAndUser("1", "1");
  if (!post) {
    notFound();
  }
  return (
    <div>
      <h1>Post #1: {post.title}</h1>
      <p>Content: {post.content}</p>
      <ToggleFavorite postId="1" isFavorite={post.isFavorite} />
    </div>
  );
}
