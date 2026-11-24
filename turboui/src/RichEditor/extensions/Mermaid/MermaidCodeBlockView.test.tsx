import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { Content, Editor, useEditor } from "../..";
import { renderMermaidDiagram } from "./renderMermaidDiagram";

jest.mock("./renderMermaidDiagram", () => ({ renderMermaidDiagram: jest.fn() }));

const handlers = { mentionedPersonLookup: async () => null, resolveResourceLinks: null };
const content = {
  type: "doc",
  content: [
    {
      type: "codeBlock",
      attrs: { language: "mermaid" },
      content: [{ type: "text", text: "flowchart TD\n  A --> B" }],
    },
  ],
};

function Harness({ editable, initialContent = content }: { editable: boolean; initialContent?: object }) {
  const editor = useEditor({ content: initialContent, editable, handlers });
  return editable ? <Editor editor={editor} /> : <Content editor={editor} />;
}

beforeEach(() => {
  document.documentElement.classList.remove("dark", "light");
  jest.mocked(renderMermaidDiagram).mockReset();
  jest.mocked(renderMermaidDiagram).mockResolvedValue('<svg data-testid="rendered-mermaid"></svg>');
});

afterEach(() => {
  document.documentElement.classList.remove("dark", "light");
});

it("renders Mermaid content as a diagram in read-only rich text", async () => {
  render(<Harness editable={false} />);

  const preview = await screen.findByRole("img", { name: "Diagram preview" });
  await waitFor(() => expect(preview.querySelector('[data-testid="rendered-mermaid"]')).toBeInTheDocument());
  expect(renderMermaidDiagram).toHaveBeenCalledWith("flowchart TD\n  A --> B", expect.any(String), "light");
});

it("re-renders Mermaid content when the color mode changes", async () => {
  document.documentElement.classList.add("dark");
  render(<Harness editable={false} />);

  await waitFor(() =>
    expect(renderMermaidDiagram).toHaveBeenLastCalledWith("flowchart TD\n  A --> B", expect.any(String), "dark"),
  );

  document.documentElement.classList.replace("dark", "light");

  await waitFor(() =>
    expect(renderMermaidDiagram).toHaveBeenLastCalledWith("flowchart TD\n  A --> B", expect.any(String), "light"),
  );
});

it("switches between the rendered preview and editable source", async () => {
  const user = userEvent.setup();
  const { container } = render(<Harness editable />);

  await screen.findByRole("img", { name: "Diagram preview" });
  await user.click(screen.getByRole("button", { name: "Edit source" }));

  expect(container.querySelector(".mermaid-source")).toBeVisible();
  expect(screen.getByText("flowchart TD", { exact: false })).toBeVisible();

  await user.click(screen.getByRole("button", { name: "Preview" }));
  expect(await screen.findByRole("img", { name: "Diagram preview" })).toBeVisible();
});

it("keeps the source visible when Mermaid cannot render it", async () => {
  jest.mocked(renderMermaidDiagram).mockRejectedValue(new Error("Parse error"));
  const { container } = render(<Harness editable={false} />);

  await waitFor(() => expect(container.querySelector('[data-test-id="mermaid-render-error"]')).toBeInTheDocument());
  await waitFor(() => expect(container.querySelector(".mermaid-source")).toBeVisible());
});

it("renders corrected Mermaid content after a read-only render failure", async () => {
  jest.mocked(renderMermaidDiagram).mockRejectedValueOnce(new Error("Parse error"));
  const { container, rerender } = render(<Harness editable={false} />);

  await waitFor(() => expect(container.querySelector('[data-test-id="mermaid-render-error"]')).toBeInTheDocument());

  const correctedContent = {
    type: "doc",
    content: [
      {
        type: "codeBlock",
        attrs: { language: "mermaid" },
        content: [{ type: "text", text: "flowchart LR\n  Plan --> Done" }],
      },
    ],
  };
  rerender(<Harness editable={false} initialContent={correctedContent} />);

  const preview = await screen.findByRole("img", { name: "Diagram preview" });
  await waitFor(() => expect(preview.querySelector('[data-testid="rendered-mermaid"]')).toBeInTheDocument());
  expect(renderMermaidDiagram).toHaveBeenLastCalledWith("flowchart LR\n  Plan --> Done", expect.any(String), "light");
});

it("keeps ordinary code blocks as source code", async () => {
  const codeContent = {
    type: "doc",
    content: [
      {
        type: "codeBlock",
        attrs: { language: "typescript" },
        content: [{ type: "text", text: "const ready = true;" }],
      },
    ],
  };
  render(<Harness editable={false} initialContent={codeContent} />);

  const source = await screen.findByText("const ready = true;");
  expect(source.closest("pre")).toHaveAttribute("data-language", "typescript");
  expect(renderMermaidDiagram).not.toHaveBeenCalled();
});
