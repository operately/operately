import { createMemoryRouter, type ShouldRevalidateFunctionArgs } from "react-router";
import { shouldRevalidate } from "./revalidation";

function navigation(from: string, to: string, overrides: Partial<ShouldRevalidateFunctionArgs> = {}) {
  return {
    currentUrl: new URL(from, "https://operately.test"),
    nextUrl: new URL(to, "https://operately.test"),
    currentParams: { id: "doc" },
    nextParams: { id: "doc" },
    defaultShouldRevalidate: true,
    ...overrides,
  };
}

it.each([
  ["/documents/doc", "/documents/doc?inlineThread=one"],
  ["/documents/doc?inlineThread=one", "/documents/doc?inlineThread=two"],
  ["/documents/doc?inlineThread=one", "/documents/doc"],
  ["/documents/doc?filter=open&inlineThread=one", "/documents/doc?inlineThread=two&filter=open#message"],
])("skips loading when only the thread selection changes: %s → %s", (from, to) => {
  expect(shouldRevalidate(navigation(from, to))).toBe(false);
});

it.each([
  ["/documents/doc?inlineThread=one", "/documents/other?inlineThread=two"],
  ["/company-a/documents/doc", "/company-b/documents/doc?inlineThread=one"],
  ["/documents/doc?filter=open", "/documents/doc?filter=all&inlineThread=one"],
  ["/documents/doc?inlineThread=one", "/documents/doc?inlineThread=one"],
])("preserves revalidation for data changes and refreshes: %s → %s", (from, to) => {
  expect(shouldRevalidate(navigation(from, to))).toBe(true);
});

it("preserves submission revalidation when the thread selection also changes", () => {
  expect(
    shouldRevalidate(navigation("/documents/doc", "/documents/doc?inlineThread=one", { formMethod: "POST" })),
  ).toBe(true);
});

it("preserves the router default for unrelated navigation", () => {
  expect(shouldRevalidate(navigation("/documents/doc", "/documents/other", { defaultShouldRevalidate: false }))).toBe(
    false,
  );
});

it("loads direct links once, skips thread navigation, and still handles refreshes and document changes", async () => {
  const loader = jest.fn(async () => null);
  const router = createMemoryRouter([{ path: "/documents/:id", loader, shouldRevalidate }], {
    initialEntries: ["/documents/doc?inlineThread=one"],
  });

  try {
    if (!router.state.initialized) {
      await new Promise<void>((resolve) => {
        const unsubscribe = router.subscribe((state) => {
          if (state.initialized) {
            unsubscribe();
            resolve();
          }
        });
      });
    }
    expect(loader).toHaveBeenCalledTimes(1);
    for (const url of ["/documents/doc?inlineThread=two", "/documents/doc", "/documents/doc?inlineThread=one"]) {
      await router.navigate(url, { replace: true });
      expect(loader).toHaveBeenCalledTimes(1);
      expect(router.state.location.pathname + router.state.location.search).toBe(url);
    }
    await router.revalidate();
    expect(loader).toHaveBeenCalledTimes(2);
    await router.navigate("/documents/other?inlineThread=one");
    expect(loader).toHaveBeenCalledTimes(3);
  } finally {
    router.dispose();
  }
});
