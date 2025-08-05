interface Space {
  id: string;
  name: string;
  link: string;
}

export const spaceSearchFn = async ({ query }: { query: string }): Promise<Space[]> => {
  return [
    { id: "1", name: "Product", link: "/spaces/1" },
    { id: "2", name: "Marketing", link: "/spaces/2" },
    { id: "3", name: "Engineering", link: "/spaces/3" },
  ].filter((space) => space.name.toLowerCase().includes(query.toLowerCase()));
};
