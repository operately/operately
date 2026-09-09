import React, { act } from "react";
import { createRoot } from "react-dom/client";

const cleanups = new Set<() => void>();
afterEach(() => {
  cleanups.forEach((cleanup) => cleanup());
  cleanups.clear();
});

// Use the app's React/ReactDOM pair; TurboUI has a separate copy for its tests.
export function renderHook<Props, Result>(
  hook: (props: Props) => Result,
  options: { initialProps: Props; wrapper?: React.ComponentType<React.PropsWithChildren> },
) {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement("div"));
  const result: { current?: Result } = {};
  const Wrapper = options.wrapper ?? React.Fragment;
  function Harness({ props }: { props: Props }) {
    result.current = hook(props);
    return null;
  }
  function rerender(props: Props) {
    act(() =>
      root.render(
        <Wrapper>
          <Harness props={props} />
        </Wrapper>,
      ),
    );
  }
  function unmount() {
    if (cleanups.delete(unmount)) act(() => root.unmount());
  }
  cleanups.add(unmount);
  rerender(options.initialProps);
  return {
    result: {
      get current(): Result {
        if (result.current === undefined) throw new Error("Hook has not rendered");
        return result.current;
      },
    },
    rerender,
    unmount,
  };
}

export async function waitFor(assertion: () => void) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      assertion();
      return;
    } catch (error) {
      if (attempt === 99) throw error;
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }
  }
}
export { act };
