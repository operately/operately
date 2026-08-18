import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { InlineTaskCreator } from "./InlineTaskCreator";

describe("InlineTaskCreator", () => {
  it("creates a task with its trimmed name", () => {
    const onCreate = jest.fn();
    render(<InlineTaskCreator onCreate={onCreate} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Add task" }), {
      target: { value: "  Write release notes  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onCreate).toHaveBeenCalledWith("Write release notes");
    expect(screen.getByRole("textbox", { name: "Add task" })).toHaveValue("");
  });

  it("opens advanced creation on Shift+Enter when available", () => {
    const onCreate = jest.fn();
    const onRequestAdvanced = jest.fn();
    render(<InlineTaskCreator onCreate={onCreate} onRequestAdvanced={onRequestAdvanced} />);

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Add task" }), { key: "Enter", shiftKey: true });

    expect(onRequestAdvanced).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("creates a task on Shift+Enter when advanced creation is unavailable", () => {
    const onCreate = jest.fn();
    render(<InlineTaskCreator onCreate={onCreate} />);

    const input = screen.getByRole("textbox", { name: "Add task" });
    fireEvent.change(input, { target: { value: "Template task" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(onCreate).toHaveBeenCalledWith("Template task");
  });
});
