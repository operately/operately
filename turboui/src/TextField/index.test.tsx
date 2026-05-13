import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { TextField } from ".";

describe("TextField", () => {
  let offsetWidthSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    offsetWidthSpy = jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function () {
      return (this.textContent || "").length * 8;
    });
  });

  afterEach(() => {
    offsetWidthSpy.mockRestore();
  });

  it("resizes a single-line inline input while typing", () => {
    const { container } = render(<TextField text="Short" onChange={jest.fn()} testId="title-field" />);
    const field = container.querySelector('[data-test-id="title-field"]');

    if (!field) throw new Error("Expected title field to render");
    fireEvent.click(field);

    const input = container.querySelector<HTMLInputElement>('[data-test-id="title-field-input"]');
    if (!input) throw new Error("Expected title field input to render");
    expect(input).toHaveStyle({ width: "50px" });

    fireEvent.change(input, { target: { value: "A much longer title" } });

    expect(input).toHaveStyle({ width: "162px" });
  });
});
