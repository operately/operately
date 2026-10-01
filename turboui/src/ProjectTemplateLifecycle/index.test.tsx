import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { showSuccessToast } from "../Toasts";
import { ProjectTemplateLifecycleDialogs } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";

jest.mock("../Toasts", () => ({
  showSuccessToast: jest.fn(),
  showErrorToast: jest.fn(),
  showInfoToast: jest.fn(),
}));

const template = { id: "template-1", name: "Launch kit" };

describe("template lifecycle translations", () => {
  afterEach(cleanup);
  setupTestCatalog();

  it("uses the Portuguese catalog and keeps the template name literal", async () => {
    await i18n.changeLanguage("pt-BR");
    const props = handlers();
    render(
      <ProjectTemplateLifecycleDialogs
        action="archive"
        template={{ id: "template-1", name: "Launch <QA> & Sales" }}
        {...props}
      />,
    );
    expect(screen.getByRole("heading")).toHaveTextContent("Arquivar “Launch <QA> & Sales”?");
    await userEvent.setup().click(screen.getByRole("button", { name: "Arquivar template" }));
    await waitFor(() => expect(props.onArchive).toHaveBeenCalledWith("template-1"));
    expect(showSuccessToast).toHaveBeenCalledWith("Template arquivado", "Ele pode ser restaurado depois.");
  });

  it("looks up the duplication form and its failure feedback", async () => {
    i18n.addResourceBundle(
      "pt-BR",
      "translation",
      {
        "Duplicate project template": "Título traduzido",
        "Duplicate template": "Duplicar agora",
        "The template could not be duplicated. Try again.": "Falha traduzida",
      },
      true,
      true,
    );
    await i18n.changeLanguage("pt-BR");
    const props = handlers({ onDuplicate: jest.fn().mockResolvedValue({ success: false }) });
    render(<ProjectTemplateLifecycleDialogs action="duplicate" template={template} {...props} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Título traduzido");
    await userEvent.setup().click(screen.getByRole("button", { name: "Duplicar agora" }));
    expect(await screen.findByText("Falha traduzida")).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });
});

function handlers(overrides: Partial<React.ComponentProps<typeof ProjectTemplateLifecycleDialogs>> = {}) {
  return {
    onDuplicate: jest.fn().mockResolvedValue({ success: true }),
    onArchive: jest.fn().mockResolvedValue({ success: true }),
    onRestore: jest.fn().mockResolvedValue({ success: true }),
    onDelete: jest.fn().mockResolvedValue({ success: true }),
    onClose: jest.fn(),
    ...overrides,
  };
}

describe("ProjectTemplateLifecycleDialogs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a success toast after duplicating a template", async () => {
    const user = userEvent.setup();
    const props = handlers();
    render(<ProjectTemplateLifecycleDialogs action="duplicate" template={template} {...props} />);

    await user.click(screen.getByRole("button", { name: "Duplicate template" }));

    await waitFor(() => expect(props.onDuplicate).toHaveBeenCalledWith("template-1", "Copy of Launch kit"));
    expect(showSuccessToast).toHaveBeenCalledWith("Template duplicated", "You're now editing the copy.");
  });

  it("does not toast when duplicating fails", async () => {
    const user = userEvent.setup();
    const props = handlers({
      onDuplicate: jest.fn().mockResolvedValue({ success: false, error: "Could not duplicate" }),
    });
    render(<ProjectTemplateLifecycleDialogs action="duplicate" template={template} {...props} />);

    await user.click(screen.getByRole("button", { name: "Duplicate template" }));

    await waitFor(() => expect(props.onDuplicate).toHaveBeenCalled());
    expect(showSuccessToast).not.toHaveBeenCalled();
  });

  it("shows a success toast after archiving a template", async () => {
    const user = userEvent.setup();
    const props = handlers();
    render(<ProjectTemplateLifecycleDialogs action="archive" template={template} {...props} />);

    await user.click(screen.getByRole("button", { name: "Archive template" }));

    await waitFor(() => expect(props.onArchive).toHaveBeenCalledWith("template-1"));
    expect(showSuccessToast).toHaveBeenCalledWith("Template archived", "It can be restored later.");
  });

  it("does not toast when archiving fails", async () => {
    const user = userEvent.setup();
    const props = handlers({
      onArchive: jest.fn().mockResolvedValue({ success: false, error: "Could not archive" }),
    });
    render(<ProjectTemplateLifecycleDialogs action="archive" template={template} {...props} />);

    await user.click(screen.getByRole("button", { name: "Archive template" }));

    await waitFor(() => expect(props.onArchive).toHaveBeenCalled());
    expect(showSuccessToast).not.toHaveBeenCalled();
  });

  it("shows a success toast after restoring a template", async () => {
    const user = userEvent.setup();
    const props = handlers();
    render(<ProjectTemplateLifecycleDialogs action="restore" template={template} {...props} />);

    await user.click(screen.getByRole("button", { name: "Restore template" }));

    await waitFor(() => expect(props.onRestore).toHaveBeenCalledWith("template-1"));
    expect(showSuccessToast).toHaveBeenCalledWith("Template restored", "It's available for project creation again.");
  });

  it("does not toast when restoring fails", async () => {
    const user = userEvent.setup();
    const props = handlers({
      onRestore: jest.fn().mockResolvedValue({ success: false, error: "Could not restore" }),
    });
    render(<ProjectTemplateLifecycleDialogs action="restore" template={template} {...props} />);

    await user.click(screen.getByRole("button", { name: "Restore template" }));

    await waitFor(() => expect(props.onRestore).toHaveBeenCalled());
    expect(showSuccessToast).not.toHaveBeenCalled();
  });
});
