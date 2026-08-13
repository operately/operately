import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { FolderSelectField } from ".";

jest.mock("react-spinners", () => ({
  BeatLoader: () => <span data-test-id="folder-select-loading" />,
}));

function renderField(props: Partial<FolderSelectField.Props> = {}) {
  const onSelect = jest.fn();
  const onGoBack = jest.fn();

  const view = render(
    <FolderSelectField
      label="Select destination"
      field="location"
      current={{ id: "root", name: "Documents & Files" }}
      nodes={[
        {
          id: "assets",
          name: "Assets",
          selectable: true,
          icon: <span>folder</span>,
          onSelect,
        },
        {
          id: "doc-1",
          name: "Launch guide",
          selectable: false,
          icon: <span>doc</span>,
          onSelect,
        },
      ]}
      {...props}
    />,
  );

  return { ...view, onSelect, onGoBack };
}

describe("FolderSelectField", () => {
  test("renders the current location and selectable folders", () => {
    const { container } = renderField();

    expect(container.querySelector('[data-test-id="folder-select-current-root"]')).toHaveTextContent(
      "Documents & Files",
    );
    expect(container.querySelector('[data-test-id="folder-select-node-assets"]')).toHaveTextContent("Assets");
    expect(screen.getByText("Launch guide")).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="folder-select-node-doc-1"]')).not.toBeInTheDocument();
  });

  test("calls onSelect for selectable rows only", () => {
    const { container, onSelect } = renderField();

    fireEvent.click(container.querySelector('[data-test-id="folder-select-node-assets"]') as Element);
    expect(onSelect).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Launch guide"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test("calls onGoBack from the header", () => {
    const onGoBack = jest.fn();
    const { container } = renderField({
      current: { id: "assets", name: "Assets" },
      onGoBack,
    });

    fireEvent.click(container.querySelector('[data-test-id="folder-select-go-back"]') as Element);
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  test("shows a loading indicator on a row", () => {
    const { container } = renderField({
      nodes: [
        {
          id: "assets",
          name: "Assets",
          selectable: true,
          loading: true,
          icon: <span>folder</span>,
          onSelect: () => undefined,
        },
      ],
    });

    expect(container.querySelector('[data-test-id="folder-select-loading"]')).toBeInTheDocument();
  });

  test("hides the header while the current location is loading", () => {
    const { container } = renderField({ current: null, nodes: [] });

    expect(container.querySelector('[data-test-id="folder-select-current-root"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-test-id="folder-select-go-back"]')).not.toBeInTheDocument();
  });
});
