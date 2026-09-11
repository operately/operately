import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

import { SearchActivator } from "./SearchActivator";

describe("SearchActivator", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    ["macOS", "MacIntel", "⌘K"],
    ["Windows", "Win32", "Ctrl K"],
    ["Linux", "Linux x86_64", "Ctrl K"],
  ])("shows the global search shortcut for %s", (_operatingSystem, platform, shortcut) => {
    jest.spyOn(window.navigator, "platform", "get").mockReturnValue(platform);

    render(<SearchActivator placeholder="Search..." onActivate={jest.fn()} />);

    expect(screen.getByRole("button", { name: /search/i })).toHaveTextContent(shortcut);
  });
});
