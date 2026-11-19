import "@testing-library/jest-dom";
import { configure, act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { TitleSetupPrompt } from ".";

configure({ testIdAttribute: "data-test-id" });

it("requires a nonblank title and trims it before saving", async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  render(<TitleSetupPrompt onSave={onSave} onSkip={jest.fn()} />);
  const input = screen.getByRole("textbox", { name: "Title in Company" });
  expect(screen.getByRole("heading", { name: "What's your title?" })).toBeInTheDocument();
  const save = screen.getByTestId("save-title");
  expect(input).toHaveFocus();
  expect(save).toBeDisabled();
  fireEvent.change(input, { target: { value: "   " } });
  expect(save).toBeDisabled();
  fireEvent.change(input, { target: { value: "  Designer  " } });
  fireEvent.click(save);
  await waitFor(() => expect(onSave).toHaveBeenCalledWith("Designer"));
});

it("skips without saving the draft title", async () => {
  const onSave = jest.fn();
  const onSkip = jest.fn().mockResolvedValue(undefined);
  render(<TitleSetupPrompt onSave={onSave} onSkip={onSkip} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Draft" } });
  fireEvent.click(screen.getByTestId("skip-title"));
  await waitFor(() => expect(onSkip).toHaveBeenCalledTimes(1));
  expect(onSave).not.toHaveBeenCalled();
});

it.each(["save", "skip"])("keeps the prompt and draft available after a failed %s", async (action) => {
  const callback = jest.fn().mockRejectedValueOnce(new Error("Network error")).mockResolvedValue(undefined);
  render(<TitleSetupPrompt onSave={callback} onSkip={callback} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Designer" } });
  fireEvent.click(screen.getByTestId(`${action}-title`));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveValue("Designer");
  fireEvent.click(screen.getByTestId(`${action}-title`));
  await waitFor(() => expect(callback).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
});

it("disables both actions while a request is pending", async () => {
  let finish: () => void = () => {};
  const onSkip = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<TitleSetupPrompt onSave={jest.fn()} onSkip={onSkip} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Designer" } });
  fireEvent.click(screen.getByTestId("skip-title"));
  expect(screen.getByTestId("save-title")).toBeDisabled();
  expect(screen.getByTestId("skip-title")).toBeDisabled();
  await act(async () => finish());
});
