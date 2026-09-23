import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DocumentPublicSharingModal } from ".";

describe("DocumentPublicSharingModal", () => {
  it("copies the public URL", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const publicUrl = "https://example.test/public/documents/token";
    render(<DocumentPublicSharingModal isOpen onClose={jest.fn()} publicUrl={publicUrl} onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy public link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(publicUrl));
  });

  it("enables sharing only after an explicit action", async () => {
    const onChange = jest.fn().mockResolvedValue(undefined);
    render(<DocumentPublicSharingModal isOpen onClose={jest.fn()} publicUrl={null} onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Enable public sharing" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(true));
  });

  it("shows the existing link and allows revocation", async () => {
    const onChange = jest.fn().mockResolvedValue(undefined);
    render(
      <DocumentPublicSharingModal
        isOpen
        onClose={jest.fn()}
        publicUrl="https://example.test/public/documents/token"
        onChange={onChange}
      />,
    );
    expect(document.querySelector('[data-test-id="public-document-url"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Disable public sharing" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(false));
  });

  it("keeps the dialog usable after a failed update", async () => {
    const onChange = jest.fn().mockRejectedValue(new Error("offline"));
    render(<DocumentPublicSharingModal isOpen onClose={jest.fn()} publicUrl={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Enable public sharing" }));
    await waitFor(() => expect(document.querySelector('[data-test-id="public-sharing-error"]')).toBeTruthy());
    expect(screen.getByRole("button", { name: "Enable public sharing" }).hasAttribute("disabled")).toBe(false);
  });
});
