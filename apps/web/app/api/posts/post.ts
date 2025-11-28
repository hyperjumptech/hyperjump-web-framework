export type Post = {
  id: string;
  title: string;
  content: string;
  userId: string;
};

export const getPost = async (id: string) => {
  const post: Post | null = {
    id,
    title: "Hello World",
    content: "This is a test post",
    userId: "1",
  };
  return post;
};

export const updatePost = async (
  id: string,
  data: { title: string; content: string }
) => {
  const post: Post | null = {
    id,
    title: data.title,
    content: data.content,
    userId: "1",
  };
  return post;
};
