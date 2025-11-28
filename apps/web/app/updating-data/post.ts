const fakeData = [
  {
    id: "1",
    title: "Post 1",
    content: "Content 1",
    isFavorite: false,
    userId: "1",
  },
  {
    id: "2",
    title: "Post 2",
    content: "Content 2",
    isFavorite: false,
    userId: "1",
  },
  {
    id: "3",
    title: "Post 3",
    content: "Content 3",
    isFavorite: false,
    userId: "12",
  },
];

export const getPostByIdAndUser = async (postId: string, userId: string) => {
  // connect to db
  return fakeData.find((post) => post.id === postId && post.userId === userId);
};

export const updatePost = async (
  postId: string,
  userId: string,
  isFavorite: boolean
) => {
  // connect to db
  const post = fakeData.find(
    (post) => post.id === postId && post.userId === userId
  );
  if (!post) {
    return {
      ok: 0,
      error: "Post not found",
    };
  }
  post.isFavorite = isFavorite;
  return {
    ok: 1,
    message: "Post updated successfully",
  };
};
