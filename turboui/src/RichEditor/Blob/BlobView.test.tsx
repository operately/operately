import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { SlideIn } from "../../SlideIn";
import { BlobView } from "./BlobView";

jest.mock("@tiptap/react", () => {
  const React = require("react");

  return {
    NodeViewContent: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) =>
      React.createElement("span", props, children),
    NodeViewWrapper: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement("div", props, children),
  };
});

describe("BlobView image preview", () => {
  it("closes the image preview before closing its containing slide-in", () => {
    const closeSlideIn = jest.fn();

    render(
      <SlideIn isOpen onClose={closeSlideIn}>
        <BlobView
          node={{
            attrs: {
              filetype: "image/png",
              src: "https://example.com/image.png",
              alt: "Example image",
              title: "Example image",
            },
          }}
          deleteNode={jest.fn()}
          updateAttributes={jest.fn()}
          editor={{ view: { editable: false } }}
        />
      </SlideIn>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Example image preview" }));
    expect(screen.getByRole("dialog", { name: "Example image" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Example image" })).not.toBeInTheDocument();
    expect(closeSlideIn).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(closeSlideIn).toHaveBeenCalledTimes(1);
  });
});
