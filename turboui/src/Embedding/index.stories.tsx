import React from "react";
import { createPortal } from "react-dom";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { EmbeddingProvider } from ".";
import { PrimaryButton, SecondaryButton } from "../Button";
import { ConfirmDialog } from "../ConfirmDialog";
import { DateField } from "../DateField";
import * as Forms from "../Forms";
import { Menu, MenuActionItem, SubMenu } from "../Menu";
import { Modal } from "../Modal";
import { useHtmlTitle } from "../Page/useHtmlTitle";
import { Reactions } from "../Reactions";
import { Editor, useEditor } from "../RichEditor";
import RichContent from "../RichContent";
import { SlideIn } from "../SlideIn";
import { Tooltip } from "../Tooltip";
import { useWindowSizeBreakpoints } from "../utils/useWindowSizeBreakpoint";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
// Vite compiles this stylesheet for the harness; it is not part of the public API.
// @ts-expect-error Vite's inline CSS import returns a string.
import styles from "../../styles/index.css?inline";

const people = [
  { id: "alex", fullName: "Alex Morgan", title: "Designer", avatarUrl: null, profileLink: "#" },
  { id: "sam", fullName: "Sam Rivera", title: "Engineer", avatarUrl: null, profileLink: "#" },
];

function ShadowPreview({
  scale = 1,
  portalInset = 0,
  children,
}: {
  scale?: number;
  portalInset?: number;
  children?: React.ReactNode;
}) {
  const [host, setHost] = React.useState<HTMLDivElement | null>(null);
  const [root, setRoot] = React.useState<ShadowRoot | null>(null);
  const [scroll, setScroll] = React.useState<HTMLDivElement | null>(null);
  const [portals, setPortals] = React.useState<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    if (host) setRoot(host.shadowRoot ?? host.attachShadow({ mode: "open" }));
  }, [host]);
  const cache = React.useMemo(() => (root ? createCache({ key: "embedded", container: root }) : null), [root]);

  return (
    <div style={{ width: 1100 * scale, height: 760 * scale, margin: 24 }} data-test-id="shadow-preview">
      <div
        ref={setHost}
        style={{ width: 1100, height: 760, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {root &&
          cache &&
          createPortal(
            <CacheProvider value={cache}>
              <style>{styles}</style>
              <div
                className="light"
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 16,
                  lineHeight: 1.5,
                  transform: "translateZ(0)",
                }}
              >
                <div
                  ref={setScroll}
                  style={{ height: "100%", overflow: "auto", background: "var(--color-surface-base)" }}
                  data-test-id="preview-scroll"
                >
                  {portals && scroll && (
                    <EmbeddingProvider portalContainer={portals} scrollContainer={scroll} manageDocumentTitle={false}>
                      {children ?? <Controls />}
                    </EmbeddingProvider>
                  )}
                </div>
                <div
                  ref={setPortals}
                  style={{ position: "absolute", inset: portalInset, pointerEvents: "none" }}
                  data-test-id="preview-portals"
                />
                {/* Let noninteractive layers, such as table action highlights, keep pointer-events: none. */}
                <style>{':where([data-test-id="preview-portals"] > *) { pointer-events: auto; }'}</style>
              </div>
            </CacheProvider>,
            root,
          )}
      </div>
    </div>
  );
}

function Controls() {
  useHtmlTitle("This must not replace the host title");
  const breakpoint = useWindowSizeBreakpoints();
  const [modal, setModal] = React.useState(false);
  const [slide, setSlide] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [date, setDate] = React.useState<DateField.ContextualDate | null>(null);
  const [count, setCount] = React.useState(0);
  const [reactions, setReactions] = React.useState<Reactions.Reaction[]>([]);
  const form = Forms.useForm({ fields: { champion: null }, submit: async () => {} });
  const handlers = React.useMemo(
    () => ({
      ...createMockRichEditorHandlers(),
      peopleSearch: async ({ query }: { query: string }) =>
        people.filter((p) => p.fullName.toLowerCase().includes(query.toLowerCase())),
      mentionedPersonLookup: async (id: string) => people.find((p) => p.id === id) ?? null,
    }),
    [],
  );
  const editor = useEditor({ handlers, content: "<p>Type @ to mention a fixture person.</p>" });

  return (
    <div className="p-8 space-y-6 text-content-base">
      <p>
        Shadow DOM controls · breakpoint: <span data-test-id="breakpoint">{breakpoint}</span>
      </p>
      <div className="flex gap-4">
        <PrimaryButton onClick={() => setModal(true)} testId="open-modal">
          Open modal
        </PrimaryButton>
        <SecondaryButton onClick={() => setSlide(true)} testId="open-slide">
          Open slide-in
        </SecondaryButton>
        <Tooltip content="Inside the shadow root">
          <span data-test-id="tooltip-target">Hover for tooltip</span>
        </Tooltip>
        <Menu testId="demo-menu">
          <MenuActionItem onClick={() => setCount((c) => c + 1)}>Increment</MenuActionItem>
          <SubMenu label="More">
            <MenuActionItem onClick={() => setCount((c) => c + 1)}>Increment again</MenuActionItem>
          </SubMenu>
        </Menu>
        <span data-test-id="count">{count}</span>
      </div>
      <DateField date={date} onDateSelect={setDate} testId="outer-date" />
      <PointMenu />
      <Reactions
        reactions={reactions}
        currentPersonId="alex"
        onAddReaction={async (emoji) => {
          const person = people[0];
          if (person) setReactions((items) => [...items, { id: crypto.randomUUID(), emoji, person }]);
        }}
        onRemoveReaction={async (id) => setReactions((items) => items.filter((item) => item.id !== id))}
      />
      <Editor editor={editor} />
      <div style={{ height: 600 }}>Scrollable preview content</div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Embedded modal" testId="embedded-modal">
        <ImagePreview />
        <DateField date={date} onDateSelect={setDate} testId="modal-date" />
        <Forms.Form form={form}>
          <Forms.SelectPerson
            field="champion"
            label="Champion"
            searchFn={async () => people}
            required={false}
            portalMenu
          />
        </Forms.Form>
        <Tooltip content="This tooltip must not release the modal's focus trap">
          <span>
            <SecondaryButton onClick={() => setConfirm(true)} testId="open-confirm">
              Open confirmation
            </SecondaryButton>
          </span>
        </Tooltip>
      </Modal>
      <SlideIn isOpen={slide} onClose={() => setSlide(false)} testId="embedded-slide">
        <div className="p-8">
          <SecondaryButton onClick={() => setModal(true)}>Open modal in slide-in</SecondaryButton>
        </div>
      </SlideIn>
      <ConfirmDialog
        isOpen={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={() => setConfirm(false)}
        title="Nested confirmation"
        message="Closing this keeps the modal open."
      />
    </div>
  );
}

function PointMenu() {
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <SecondaryButton
        testId="point-menu"
        onClick={(event: React.MouseEvent) => setPosition({ x: event.clientX, y: event.clientY })}
      >
        Open menu at pointer
      </SecondaryButton>
      {position && (
        <Menu
          anchorPosition={position}
          open
          onOpenChange={(open) => {
            if (!open) setPosition(null);
          }}
        >
          <MenuActionItem onClick={() => setPosition(null)}>Close pointer menu</MenuActionItem>
        </Menu>
      )}
    </>
  );
}

function ImagePreview() {
  const image = {
    type: "blob",
    attrs: {
      src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="cornflowerblue"/></svg>',
      alt: "Sample image",
      filetype: "image/svg+xml",
      status: "uploaded",
    },
  };
  return (
    <RichContent
      content={{ type: "doc", content: [{ type: "paragraph", content: [image] }] }}
      mentionedPersonLookup={async () => null}
      taskList={{ canEdit: false }}
    />
  );
}

export default {
  title: "Utilities/Embedding",
  component: ShadowPreview,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ShadowPreview>;
export const ShadowDom: StoryObj<typeof ShadowPreview> = {};
export const Scaled: StoryObj<typeof ShadowPreview> = { args: { scale: 0.6 } };
export const IndependentPreviews: StoryObj<typeof ShadowPreview> = {
  render: () => (
    <>
      <ShadowPreview scale={0.55} />
      <ShadowPreview scale={0.55} />
    </>
  ),
};

export const OffsetPortals: StoryObj<typeof ShadowPreview> = { args: { scale: 0.6, portalInset: 40 } };

function TableMenuEditor() {
  const handlers = React.useMemo(() => createMockRichEditorHandlers(), []);
  const editor = useEditor({ handlers, content: "<p>Table menu regression</p>" });
  return (
    <div className="p-8 space-y-6 text-content-base">
      <SecondaryButton testId="outside-editor" onClick={() => {}}>
        Outside editor
      </SecondaryButton>
      <Editor editor={editor} />
    </div>
  );
}

export const TableMenus: StoryObj<typeof ShadowPreview> = {
  tags: ["table-menu-regression"],
  render: () => (
    <ShadowPreview>
      <TableMenuEditor />
    </ShadowPreview>
  ),
};
export const ScaledTableMenus: StoryObj<typeof ShadowPreview> = {
  tags: ["table-menu-regression"],
  render: () => (
    <ShadowPreview scale={0.6}>
      <TableMenuEditor />
    </ShadowPreview>
  ),
};
export const DocumentTableMenus: StoryObj<typeof ShadowPreview> = {
  tags: ["table-menu-regression"],
  render: () => <TableMenuEditor />,
};

function TableMenuDialog() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <SecondaryButton testId="open-table-dialog" onClick={() => setOpen(true)}>
        Open editor dialog
      </SecondaryButton>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Table editor" testId="table-dialog">
        <TableMenuEditor />
      </Modal>
    </>
  );
}

export const DialogTableMenus: StoryObj<typeof ShadowPreview> = {
  tags: ["table-menu-regression"],
  render: () => (
    <ShadowPreview scale={0.6}>
      <TableMenuDialog />
    </ShadowPreview>
  ),
};
