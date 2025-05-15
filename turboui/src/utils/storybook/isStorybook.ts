export const isStorybook = () => {
  return typeof window !== "undefined" && (window as any).STORYBOOK_ENV === true;
};
