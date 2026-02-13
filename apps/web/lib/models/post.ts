export type Post = {
  id: string;
  title: string;
  content: string;
  userId: string;
};

const fakeData: Post[] = [
  {
    id: "1",
    title: "Hello World",
    content: "This is a test post",
    userId: "1",
  },
  {
    id: "2",
    title: "Hello World 2",
    content: "This is a test post 2",
    userId: "1",
  },
];

export const getPostById = async (id: string) => {
  return fakeData.find((post) => post.id === id);
};

export const updatePostById = async (
  id: string,
  data: { title: string; content: string },
) => {
  const post = fakeData.find((post) => post.id === id);
  if (!post) {
    return null;
  }
  post.title = data.title;
  post.content = data.content;
  return post;
};

export const createPost = async (data: {
  title: string;
  content: string;
  userId: string;
}) => {
  const post = {
    id: crypto.randomUUID(),
    title: data.title,
    content: data.content,
    userId: data.userId,
  };
  fakeData.push(post);
  return post;
};
