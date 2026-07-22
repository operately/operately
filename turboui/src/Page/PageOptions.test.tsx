import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import * as BreakpointHooks from "../utils/useWindowSizeBreakpoint";
import { Page } from "./index";
import { PageOptions } from "./PageOptions";

jest.mock("../utils/useWindowSizeBreakpoint", () => ({
  __esModule: true,
  ...jest.requireActual("../utils/useWindowSizeBreakpoint"),
  useWindowSizeBiggerOrEqualTo: jest.fn(),
}));

const mockUseWindowSizeBiggerOrEqualTo = BreakpointHooks.useWindowSizeBiggerOrEqualTo as jest.Mock;

function IconStub() {
  return <span>icon</span>;
}

function testId(id: string) {
  return `[data-test-id="${id}"]`;
}

function renderPageOptions(options?: Page.Option[]) {
  return render(
    <MemoryRouter>
      <div className="relative">
        <PageOptions options={options} />
      </div>
    </MemoryRouter>,
  );
}

describe("PageOptions", () => {
  beforeEach(() => {
    mockUseWindowSizeBiggerOrEqualTo.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when options is undefined", () => {
    const { container } = renderPageOptions(undefined);

    expect(container.querySelector(testId("options-button"))).not.toBeInTheDocument();
  });

  it("renders nothing when options is empty", () => {
    const { container } = renderPageOptions([]);

    expect(container.querySelector(testId("options-button"))).not.toBeInTheDocument();
  });

  it("renders nothing when every option is hidden", () => {
    const { container } = renderPageOptions([
      {
        type: "link",
        icon: IconStub,
        label: "Edit",
        link: "/edit",
        hidden: true,
        testId: "edit-link",
      },
      {
        type: "action",
        icon: IconStub,
        label: "Delete",
        onClick: jest.fn(),
        hidden: true,
        testId: "delete-action",
      },
    ]);

    expect(container.querySelector(testId("options-button"))).not.toBeInTheDocument();
    expect(container.querySelector(testId("edit-link"))).not.toBeInTheDocument();
    expect(container.querySelector(testId("delete-action"))).not.toBeInTheDocument();
  });

  it("keeps marked options outside the dropdown on big screens", () => {
    const { container } = renderPageOptions([
      {
        type: "link",
        icon: IconStub,
        label: "Edit",
        link: "/edit",
        keepOutsideOnBigScreen: true,
        testId: "edit-link",
      },
      {
        type: "action",
        icon: IconStub,
        label: "Delete",
        onClick: jest.fn(),
        testId: "delete-action",
      },
    ]);

    expect(container.querySelector(testId("edit-link"))).toBeInTheDocument();
    expect(container.querySelector(testId("edit-link"))).toHaveTextContent("Edit");
    expect(container.querySelector(testId("options-button"))).toBeInTheDocument();
    expect(container.querySelector(testId("delete-action"))).not.toBeInTheDocument();
  });

  it("hides the dropdown when every visible option stays outside on big screens", () => {
    const { container } = renderPageOptions([
      {
        type: "link",
        icon: IconStub,
        label: "Edit",
        link: "/edit",
        keepOutsideOnBigScreen: true,
        testId: "edit-link",
      },
      {
        type: "action",
        icon: IconStub,
        label: "Publish",
        onClick: jest.fn(),
        keepOutsideOnBigScreen: true,
        testId: "publish-action",
      },
    ]);

    expect(container.querySelector(testId("edit-link"))).toBeInTheDocument();
    expect(container.querySelector(testId("publish-action"))).toBeInTheDocument();
    expect(container.querySelector(testId("options-button"))).not.toBeInTheDocument();
  });

  it("puts keepOutsideOnBigScreen options in the dropdown on small screens", () => {
    mockUseWindowSizeBiggerOrEqualTo.mockReturnValue(false);

    const { container } = renderPageOptions([
      {
        type: "link",
        icon: IconStub,
        label: "Edit",
        link: "/edit",
        keepOutsideOnBigScreen: true,
        testId: "edit-link",
      },
      {
        type: "action",
        icon: IconStub,
        label: "Delete",
        onClick: jest.fn(),
        testId: "delete-action",
      },
    ]);

    expect(container.querySelector(testId("options-button"))).toBeInTheDocument();
    expect(container.querySelector(testId("edit-link"))).not.toBeInTheDocument();
    expect(container.querySelector(testId("delete-action"))).not.toBeInTheDocument();
  });

  it("opens the dropdown and shows inside options", async () => {
    const user = userEvent.setup();
    const { container } = renderPageOptions([
      {
        type: "link",
        icon: IconStub,
        label: "History",
        link: "/history",
        testId: "history-link",
      },
      {
        type: "action",
        icon: IconStub,
        label: "Delete",
        onClick: jest.fn(),
        testId: "delete-action",
      },
    ]);

    await user.click(container.querySelector(testId("options-button"))!);

    await waitFor(() => {
      expect(document.querySelector(testId("history-link"))).toBeInTheDocument();
      expect(document.querySelector(testId("delete-action"))).toBeInTheDocument();
    });
  });

  it("invokes outside action callbacks", () => {
    const onClick = jest.fn();
    const { container } = renderPageOptions([
      {
        type: "action",
        icon: IconStub,
        label: "Copy",
        onClick,
        keepOutsideOnBigScreen: true,
        testId: "copy-action",
      },
    ]);

    fireEvent.click(container.querySelector(testId("copy-action"))!);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("invokes dropdown action callbacks", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const { container } = renderPageOptions([
      {
        type: "action",
        icon: IconStub,
        label: "Delete",
        onClick,
        testId: "delete-action",
      },
    ]);

    await user.click(container.querySelector(testId("options-button"))!);

    await waitFor(() => {
      expect(document.querySelector(testId("delete-action"))).toBeInTheDocument();
    });

    await user.click(document.querySelector(testId("delete-action"))!);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
