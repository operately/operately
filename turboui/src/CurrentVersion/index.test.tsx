import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";

import { CurrentVersion } from "./index";

function getCurrentVersion() {
  return document.querySelector('[data-test-id="current-version"]');
}

describe("CurrentVersion", () => {
  it("renders the brand-signature version line", () => {
    render(<CurrentVersion version="v1.8" />);

    expect(getCurrentVersion()).toHaveTextContent("Operately");
    expect(getCurrentVersion()).toHaveTextContent("v1.8");
  });

  it("adds the v prefix to bare version numbers", () => {
    render(<CurrentVersion version="1.8" />);

    expect(getCurrentVersion()).toHaveTextContent("v1.8");
  });

  it("keeps non-semver strings intact", () => {
    render(<CurrentVersion version="dev-version" />);

    expect(getCurrentVersion()).toHaveTextContent("dev-version");
  });

  it("renders nothing when the version is missing", () => {
    render(<CurrentVersion version={null} />);

    expect(getCurrentVersion()).not.toBeInTheDocument();
  });
});
