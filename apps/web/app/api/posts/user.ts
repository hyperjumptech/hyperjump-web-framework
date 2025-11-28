export type User = {
  id: string;
  name: string;
};

export const getUser = async (_request: Request) => {
  const user: User | null = {
    id: "1",
    name: "John Doe",
  };
  return user;
};
