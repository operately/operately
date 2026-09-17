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

  it("renders a compact image thumbnail without download links", () => {
    render(
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
        extension={{ options: { thumbnail: true } }}
      />,
    );

    expect(screen.getByRole("img", { name: "Example image" })).toHaveAttribute("src", "https://example.com/image.png");
    expect(screen.queryByText("Download")).not.toBeInTheDocument();
    expect(screen.queryByText("View original")).not.toBeInTheDocument();
  });

  it("renders webp and webm uploads as media thumbnails", () => {
    const { rerender } = render(
      <BlobView
        node={{
          attrs: {
            filetype: "image/webp",
            src: "https://example.com/photo.webp",
            alt: "photo.webp",
            title: "photo.webp",
          },
        }}
        deleteNode={jest.fn()}
        updateAttributes={jest.fn()}
        editor={{ view: { editable: false } }}
        extension={{ options: { thumbnail: true } }}
      />,
    );

    expect(screen.getByRole("img", { name: "photo.webp" })).toHaveAttribute("src", "https://example.com/photo.webp");

    rerender(
      <BlobView
        node={{
          attrs: {
            filetype: "video/webm",
            src: "https://example.com/clip.webm",
            title: "clip.webm",
          },
        }}
        deleteNode={jest.fn()}
        updateAttributes={jest.fn()}
        editor={{ view: { editable: false } }}
        extension={{ options: { thumbnail: true } }}
      />,
    );

    expect(document.querySelector("video")).toHaveAttribute("src", "https://example.com/clip.webm");
  });

  it("uses the URL from a legacy object blob source", () => {
    render(
      <BlobView
        node={{
          attrs: {
            filetype: "image/png",
            src: { id: "blob-1", url: "https://example.com/legacy.png" },
            alt: "legacy.png",
            title: "legacy.png",
          },
        }}
        deleteNode={jest.fn()}
        updateAttributes={jest.fn()}
        editor={{ view: { editable: false } }}
        extension={{ options: { thumbnail: true } }}
      />,
    );

    expect(screen.getByRole("img", { name: "legacy.png" })).toHaveAttribute("src", "https://example.com/legacy.png");
  });

  it("renders a compact file thumbnail as a download link", () => {
    render(
      <BlobView
        node={{
          attrs: {
            filetype: "application/pdf",
            src: "https://example.com/notes.pdf",
            title: "notes.pdf",
          },
        }}
        deleteNode={jest.fn()}
        updateAttributes={jest.fn()}
        editor={{ view: { editable: false } }}
        extension={{ options: { thumbnail: true } }}
      />,
    );

    expect(screen.getByRole("link", { name: "notes.pdf" })).toHaveAttribute(
      "href",
      "https://example.com/notes.pdf?disposition=attachment",
    );
  });
});
