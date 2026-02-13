import type { User } from "@workspace/database";
import { prismaClient } from "@workspace/database/client";

export type { User };

export const getUserById = async (id: string): Promise<User | null> => {
  const user = await prismaClient.user.findUnique({
    where: {
      id,
    },
  });
  return user;
};

export const updateUser = async (id: string, data: { name: string }) => {
  const user = await prismaClient.user.findUnique({
    where: {
      id,
    },
  });
  if (!user) {
    return null;
  }
  return prismaClient.user.update({
    where: {
      id,
    },
    data: {
      name: data.name,
    },
  });
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  return prismaClient.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
    },
  });
};

export const getTotalUsers = async () => {
  return prismaClient.user.count();
};
