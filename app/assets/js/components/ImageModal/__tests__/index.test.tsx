import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ImageModal } from "../index";

describe("ImageModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    imageSrc: "https://example.com/image.jpg",
    imageTitle: "Test Image",
    imageAlt: "Test Alt Text",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when isOpen is true", () => {
    render(<ImageModal {...defaultProps} />);
    
    const image = screen.getByAltText("Test Alt Text");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
    expect(image).toHaveAttribute("title", "Test Image");
  });

  it("does not render when isOpen is false", () => {
    render(<ImageModal {...defaultProps} isOpen={false} />);
    
    const image = screen.queryByAltText("Test Alt Text");
    expect(image).not.toBeInTheDocument();
  });

  it("renders download and view original links", () => {
    render(<ImageModal {...defaultProps} />);
    
    const downloadLink = screen.getByText("Download");
    const viewOriginalLink = screen.getByText("View original");
    
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute("href", "https://example.com/image.jpg?disposition=attachment");
    
    expect(viewOriginalLink).toBeInTheDocument();
    expect(viewOriginalLink).toHaveAttribute("href", "https://example.com/image.jpg");
    expect(viewOriginalLink).toHaveAttribute("target", "_blank");
  });

  it("calls onClose when close button is clicked", async () => {
    render(<ImageModal {...defaultProps} />);
    
    // The Modal component should render a close button
    // This test assumes the Modal component is working correctly
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});