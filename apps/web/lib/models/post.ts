import { prismaClient } from "@workspace/database/client";

export const getPostById = async (id: string) => {
  return prismaClient.post.findUnique({
    where: {
      id,
    },
  });
};

export const updatePostById = async (
  id: string,
  data: { title: string; content: string },
) => {
  const post = await prismaClient.post.findUnique({
    where: {
      id,
    },
  });
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
  return prismaClient.post.create({
    data: {
      title: data.title,
      content: data.content,
      userId: data.userId,
    },
  });
};
