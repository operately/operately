import { expect, within, userEvent } from "@storybook/test";

export const selectTab = async (canvasElement, step, tab) => {
  const canvas = within(canvasElement);

  await step("Select the " + tab + " tab", async () => {
    // Find the tab by its label text, which corresponds to the tab ID in most cases
    // For example, "all" tab has label "All work", "goals" tab has label "Goals"
    let tabLabel: string;

    // Map the tab ID to its display label
    switch (tab) {
      case "all":
        tabLabel = "All work";
        break;
      case "goals":
        tabLabel = "Goals";
        break;
      case "projects":
        tabLabel = "Projects";
        break;
      case "completed":
        tabLabel = "Completed";
        break;
      case "paused":
        tabLabel = "Paused";
        break;
      default:
        tabLabel = tab; // Fallback to using the ID directly
    }

    // Use role=link because DivLink renders as an anchor tag
    const tabElement = canvas.getByRole("link", { name: new RegExp(tabLabel, "i") });
    await userEvent.click(tabElement);
  });
};

export const assertRowsNumber = async (canvasElement, step, count) => {
  const canvas = within(canvasElement);

  await step(`Verify there are ${count} rows`, async () => {
    const rowgroups = canvas.getAllByRole("rowgroup");
    expect(rowgroups.length).toBeGreaterThan(1); // Ensure we have at least 2 rowgroups

    const tableBody = rowgroups[1]!; // Second rowgroup is tbody
    const tableRows = within(tableBody).queryAllByRole("row");

    expect(tableRows.length).toEqual(count);
  });
};

export const assertItemName = async (canvasElement, step, name) => {
  const canvas = within(canvasElement);

  await step("Verify the item name", async () => {
    const itemName = canvas.getByText(name);
    expect(itemName).toBeInTheDocument();
  });
};

export const refuteItemName = async (canvasElement, step, name) => {
  const canvas = within(canvasElement);

  await step("Verify the item name is not present", async () => {
    const itemName = canvas.queryByText(name);
    expect(itemName).not.toBeInTheDocument();
  });
};

export const toggleItem = async (canvasElement, step, name) => {
  const canvas = within(canvasElement);

  await step(`Toggle "${name}"`, async () => {
    const goalRowElement = canvas.getByText(name);
    const goalRow = goalRowElement.closest("tr") as HTMLElement;

    const expandButton = within(goalRow).getByTestId("chevron-icon");
    await userEvent.click(expandButton);
  });
};

export const assertIndentation = async (canvasElement, step, name, level, indentation) => {
  const canvas = within(canvasElement);

  await step(`Verify indentation of level ${level} items is ${indentation}`, async () => {
    const level1Project = canvas.getByText(name);
    const level1ProjectRow = level1Project.closest("tr") as HTMLElement;

    const level1ProjectIndentation = within(level1ProjectRow).getByTestId("indentation");
    expect(level1ProjectIndentation.style.width).toBe(indentation);
  });
};

export const assertItemVisible = async (canvasElement, step, name) => {
  const canvas = within(canvasElement);

  await step(`Assert that "${name}" is visible`, async () => {
    const item = canvas.getByText(name);
    expect(item).toBeInTheDocument();
  });
};

export const assertChildrenVisible = async (canvasElement, step, names) => {
  const canvas = within(canvasElement);

  await step(`Assert that children are visible`, async () => {
    names.forEach((name) => {
      const item = canvas.queryByText(name);
      expect(item).toBeInTheDocument();
    });
  });
};

export const assertChildrenHidden = async (canvasElement, step, names) => {
  const canvas = within(canvasElement);

  await step(`Assert that children are hidden`, async () => {
    names.forEach((name) => {
      const item = canvas.queryByText(name);
      expect(item).not.toBeInTheDocument();
    });
  });
};

export const assertZeroState = async (canvasElement, step) => {
  await step("Assert that the zero state guidance is visible", async () => {
    const canvas = within(canvasElement);
    const headline = canvas.getByText("Track company goals and projects");
    expect(headline).toBeInTheDocument();
  });
};

export const assertItemHasLineThrough = async (canvasElement, step, name) => {
  const canvas = within(canvasElement);

  await step(`Assert that "${name}" has line-through style`, async () => {
    const item = canvas.getByText(name);
    expect(item.style.textDecoration).toContain("line-through");
  });
};

export const refuteItemHasLineThrough = async (canvasElement, step, name) => {
  const canvas = within(canvasElement);

  await step(`Assert that "${name}" does not have line-through style`, async () => {
    const item = canvas.getByText(name);
    expect(item.style.textDecoration).not.toContain("line-through");
  });
};

type LabelColor = "green" | "amber" | "red" | "gray";

export const assertStatusBadge = async (canvasElement, step, label, color: LabelColor) => {
  const canvas = within(canvasElement);

  await step("Verify status badge has correct styles", async () => {
    const statusBadge = canvas.getByText(label);

    switch (color) {
      case "green":
        expect(statusBadge.className).toContain("bg-callout-success-bg");
        expect(statusBadge.className).toContain("text-callout-success-content");
        expect(statusBadge?.className).toContain("border-emerald-200");
        break;
      case "amber":
        expect(statusBadge.className).toContain("bg-amber-50");
        expect(statusBadge.className).toContain("text-amber-800");
        expect(statusBadge?.className).toContain("border-amber-200");
        break;
      case "red":
        expect(statusBadge.className).toContain("bg-red-50");
        expect(statusBadge.className).toContain("text-red-700");
        expect(statusBadge?.className).toContain("border-red-200");
        break;
      case "gray":
        expect(statusBadge.className).toContain("bg-gray-100");
        expect(statusBadge.className).toContain("text-gray-700");
        expect(statusBadge?.className).toContain("border-gray-200");
        break;
    }
  });
};

export const assertProgressBar = async (canvasElement, step, progress, color: LabelColor) => {
  const canvas = within(canvasElement);

  await step("Verify progress bar shows correct progress", async () => {
    const progressBar = canvas.getByRole("progress-bar");

    const innerBar = within(progressBar).getByTestId("progress-percentage-bar");

    const innerBarWidth = innerBar?.getBoundingClientRect().width || 0;
    const outerBarWidth = progressBar.getBoundingClientRect().width;

    const percentage = Math.round((innerBarWidth / outerBarWidth) * 100);

    expect(percentage).toEqual(progress);

    switch (color) {
      case "gray":
        expect(innerBar?.className).toContain("bg-gray-400");
        break;
      case "amber":
        expect(innerBar?.className).toContain("bg-amber-400");
        break;
      case "red":
        expect(innerBar?.className).toContain("bg-red-400");
        break;
      case "green":
        expect(innerBar?.className).toContain("bg-emerald-400");
        break;
    }
  });
};

export const assertPrivacyIndicator = async (canvasElement, step, name, message) => {
  const canvas = within(canvasElement);

  await step("Assert privacy indicator", async () => {
    const row = canvas.getByText(name).closest("tr");

    const privacyIndicator = within(row as HTMLElement).getByTestId("privacy-indicator");
    expect(privacyIndicator).not.toBeNull();

    expect(canvas.queryByText(message)).toBeNull();

    await userEvent.hover(privacyIndicator);

    const tooltipText = canvas.queryAllByText(message);
    expect(tooltipText).not.toBeNull();

    await userEvent.unhover(privacyIndicator);
    expect(canvas.queryByText(message)).toBeNull();
  });
};

export const refutePrivacyIndicator = async (canvasElement, step, name) => {
  const canvas = within(canvasElement);

  await step("Refute privacy indicator", async () => {
    const row = canvas.getByText(name).closest("tr");

    const privacyIndicator = within(row as HTMLElement).queryByTestId("privacy-indicator");
    expect(privacyIndicator).toBeNull();
  });
};
