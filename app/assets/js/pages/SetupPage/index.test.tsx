import SetupPage from "./index";

jest.mock("./page", () => ({ Page: () => null }));
jest.mock("@/components/Pages/Page", () => ({}));

const args = { params: {}, request: {} };

beforeEach(() => {
  global.window = { appConfig: { configured: true }, location: { href: "/setup" } } as unknown as Window &
    typeof globalThis;
});

it("does not redirect during data loading", async () => {
  await expect(SetupPage.loader(args)).resolves.toBeNull();
  expect(window.location.href).toBe("/setup");
});

it("redirects an already configured instance only during navigation", () => {
  SetupPage.onNavigate?.(args);
  expect(window.location.href).toBe("/");
});

it("keeps unconfigured instances on setup", () => {
  window.appConfig.configured = false;
  SetupPage.onNavigate?.(args);
  expect(window.location.href).toBe("/setup");
});
