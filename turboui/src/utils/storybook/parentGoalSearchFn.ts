export const parentGoalSearchFn = async ({ query }: { query: string }) => {
  return [
    {
      id: "1",
      name: "Accelerate product growth",
      link: "/goals/1",
    },
    {
      id: "2",
      name: "Improve customer satisfaction",
      link: "/goals/2",
    },
    {
      id: "3",
      name: "Expand market reach",
      link: "/goals/3",
    },
  ].filter((goal) => goal.name.toLowerCase().includes(query.toLowerCase()));
};
