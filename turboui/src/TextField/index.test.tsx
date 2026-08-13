import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { TextField } from ".";

describe("TextField", () => {
  let offsetWidthSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    offsetWidthSpy = jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
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

  it("does not notify form-field onChange until blur by default", () => {
    const onChange = jest.fn();
    const { container } = render(
      <TextField variant="form-field" text="" onChange={onChange} testId="milestone-name" />,
    );
    const input = container.querySelector<HTMLInputElement>('[data-test-id="milestone-name-input"]');
    if (!input) throw new Error("Expected form field input to render");

    fireEvent.change(input, { target: { value: "Launch" } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("Launch");
  });

  it("notifies form-field onChange while typing when onChangeOnType is set", () => {
    const onChange = jest.fn();
    const { container } = render(
      <TextField variant="form-field" text="" onChange={onChange} onChangeOnType testId="milestone-name" />,
    );
    const input = container.querySelector<HTMLInputElement>('[data-test-id="milestone-name-input"]');
    if (!input) throw new Error("Expected form field input to render");

    fireEvent.change(input, { target: { value: "Launch" } });

    expect(onChange).toHaveBeenCalledWith("Launch");
  });
});
