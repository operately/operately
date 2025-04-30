import { expect, within, userEvent } from "@storybook/test";

export const selectTab = async (canvasElement, step, tab) => {
  const canvas = within(canvasElement);

  await step("Select the " + tab + " tab", async () => {
    const tabElement = canvas.getByTestId("work-map-tab-" + tab);
    await tabElement.click();
  });
};

export const assertRowsNumber = async (canvasElement, step, count) => {
  const canvas = within(canvasElement);

  await step(`Verify there are ${count} rows`, async () => {
    const tableBody = canvas.getAllByRole("rowgroup")[1]; // Second rowgroup is tbody
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

export const openTimeframeSelector = async (canvasElement, step) => {
  const canvas = within(canvasElement);

  await step("Open the timeframe selector", async () => {
    const timeframeButton = canvas.getByRole("button", { name: /202[0-9]/ });
    await timeframeButton.click();
  });
};

export const selectYear = async (canvasElement, step, year) => {
  const canvas = within(canvasElement);

  await step("Navigate to and select the year " + year, async () => {
    const popoverContent = within(document.body)
      .getByText("Select Timeframe")
      .closest("[role='dialog']") as HTMLElement;
    expect(popoverContent).toBeInTheDocument();

    const year2023 = within(popoverContent).getByText(year);
    await year2023.click();

    // Verify the timeframe selector now shows the selected year
    const updatedTimeframeButton = canvas.getByRole("button", { name: year });
    expect(updatedTimeframeButton).toBeInTheDocument();
  });
};

export const selectQuarter = async (canvasElement, step, quarter) => {
  const canvas = within(canvasElement);

  await step("Select the Quarter tab and then " + quarter, async () => {
    const popoverContent = within(document.body)
      .getByText("Select Timeframe")
      .closest("[role='dialog']") as HTMLElement;
    expect(popoverContent).toBeInTheDocument();

    const quarterTab = within(popoverContent).getByText("Quarter");
    await quarterTab.click();

    const q3Option = within(popoverContent).getByText(quarter);
    await q3Option.click();

    const updatedTimeframeButton = canvas.getByRole("button", { name: `${quarter} 2025` });
    expect(updatedTimeframeButton).toBeInTheDocument();
  });
};

export const selectMonth = async (canvasElement, step, month) => {
  const canvas = within(canvasElement);

  await step("Select the Month tab and then " + month, async () => {
    const popoverContent = within(document.body)
      .getByText("Select Timeframe")
      .closest("[role='dialog']") as HTMLElement;
    expect(popoverContent).toBeInTheDocument();

    const monthTab = within(popoverContent).getByText("Month");
    await monthTab.click();

    const juneOption = within(popoverContent).getByText(month);
    await juneOption.click();

    const updatedTimeframeButton = canvas.getByRole("button", { name: `${month} 2025` });
    expect(updatedTimeframeButton).toBeInTheDocument();
  });
};

export const closeTimeframeSelector = async (canvasElement, step) => {
  const canvas = within(canvasElement);

  await step("Close the timeframe selector", async () => {
    await document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    const popoverExists = within(document.body).queryByText("Select Timeframe");
    expect(popoverExists).not.toBeInTheDocument();
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
