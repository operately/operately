import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TimeEntryEditor } from "./TimeEntryEditor";
import { demoProject, createDemoEntries } from "./mockData";
import { defaultFormattedTimePreferences } from "../FormattedTime";

function renderEditor(overrides: Partial<React.ComponentProps<typeof TimeEntryEditor>> = {}) {
  const props = {
    destinations: [demoProject],
    today: "2026-09-25",
    formattedTimePreferences: defaultFormattedTimePreferences,
    onSave: jest.fn().mockResolvedValue({ ok: true }),
    onClose: jest.fn(),
    ...overrides,
  };
  return { props, ...render(<TimeEntryEditor {...props} />) };
}

it("validates duration before calling the save callback", async () => {
  const { props } = renderEditor();
  fireEvent.change(screen.getByLabelText("Duration"), { target: { value: "-2h" } });
  fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
  await waitFor(() => expect(screen.getByLabelText("Duration")).toHaveAttribute("aria-invalid", "true"));
  expect(props.onSave).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Duration"), { target: { value: "1h 30m" } });
  fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
  await waitFor(() =>
    expect(props.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 5400, date: "2026-09-25", destinationId: demoProject.id }),
    ),
  );
  expect(props.onClose).toHaveBeenCalledTimes(1);
});

it("keeps the draft open after a failed save", async () => {
  const { props } = renderEditor({ onSave: jest.fn().mockResolvedValue({ ok: false, error: "Please retry." }) });
  fireEvent.change(screen.getByLabelText("Duration"), { target: { value: "45m" } });
  fireEvent.change(screen.getByLabelText("Notes (optional)"), { target: { value: "Interview notes" } });
  fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Notes (optional)")).toHaveValue("Interview notes");
  expect(props.onClose).not.toHaveBeenCalled();
});

it("preserves timestamps and seconds when only notes change", async () => {
  const original = createDemoEntries("2026-09-25")[0];
  if (!original) throw new Error("Missing fixture");
  const entry = {
    ...original,
    durationSeconds: 5407,
    startedAt: "2026-09-25T10:00:00Z",
    endedAt: "2026-09-25T11:30:07Z",
  };
  const { props } = renderEditor({ entry });
  fireEvent.change(screen.getByLabelText("Notes (optional)"), { target: { value: "Updated note" } });
  fireEvent.click(screen.getByRole("button", { name: "Save entry" }));
  await waitFor(() =>
    expect(props.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 5407, startedAt: entry.startedAt, endedAt: entry.endedAt }),
    ),
  );
});
