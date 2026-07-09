export {};

declare global {
  interface Window {
    STORYBOOK_ENV?: boolean;
    __tests?: unknown;
  }
}
