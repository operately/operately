interface StorybookWindow {
  STORYBOOK_ENV?: boolean;
}

export const isStorybook = () => {
  if (typeof window === "undefined") return false;

  return (window as StorybookWindow).STORYBOOK_ENV === true;
};
