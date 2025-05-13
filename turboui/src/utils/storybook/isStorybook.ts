export const isStorybook = () => {
  return typeof window !== "undefined" && window.STORYBOOK_ENV === true;
};
