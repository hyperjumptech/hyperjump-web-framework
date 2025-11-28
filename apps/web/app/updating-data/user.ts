const fakeUser = [
  {
    id: "1",
    name: "John Doe",
  },
  {
    id: "2",
    name: "Jane Doe",
  },
  {
    id: "3",
    name: "Jim Doe",
  },
];

export const getUser = async () => {
  // connect to db
  return fakeUser.find((user) => user.id === "1");
};
