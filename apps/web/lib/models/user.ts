export type User = {
  id: string;
  name: string;
};

const fakeData: User[] = [
  {
    id: "1",
    name: "John Doe",
  },
];

export const getUserById = async (id: string) => {
  return fakeData.find((user) => user.id === id);
};

export const updateUser = async (id: string, data: { name: string }) => {
  const user = fakeData.find((user) => user.id === id);
  if (!user) {
    return null;
  }
  user.name = data.name;
  return user;
};

export const createUser = async (data: { name: string }) => {
  const user = {
    id: crypto.randomUUID(),
    name: data.name,
  };
  fakeData.push(user);
  return user;
};
