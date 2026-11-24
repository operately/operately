import type { NodeViewProps } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import React from "react";
import { useTranslation } from "react-i18next";

import { SecondaryButton } from "../../../Button";
import { ErrorCallout } from "../../../Callouts";
import { IconEye, IconPencil } from "../../../icons";
import classNames from "../../../utils/classnames";
import { renderMermaidDiagram } from "./renderMermaidDiagram";
import { useMermaidColorMode } from "./useMermaidColorMode";

type DisplayMode = "preview" | "source";

export function MermaidCodeBlockView({ node, editor }: NodeViewProps): JSX.Element {
  if (node.attrs.language?.toLowerCase() !== "mermaid") {
    return (
      <NodeViewWrapper as="pre" data-language={node.attrs.language ?? undefined}>
        <NodeViewContent<"code"> as="code" />
      </NodeViewWrapper>
    );
  }

  return <MermaidView node={node} editor={editor} />;
}

function MermaidView({ node, editor }: Pick<NodeViewProps, "node" | "editor">): JSX.Element {
  const { t } = useTranslation();
  const source = node.textContent;
  const editable = editor.isEditable;
  const colorMode = useMermaidColorMode();
  const [mode, setMode] = React.useState<DisplayMode>(() => (editable && source.trim() === "" ? "source" : "preview"));
  const [svg, setSvg] = React.useState<string>();
  const [renderFailed, setRenderFailed] = React.useState(false);
  const reactId = React.useId();
  const renderSequence = React.useRef(0);
  const showSource = mode === "source" || renderFailed || source.trim() === "";

  React.useEffect(() => {
    if (mode !== "preview" || source.trim() === "") return;

    let active = true;
    const sequence = ++renderSequence.current;
    const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}-${sequence}`;

    setSvg(undefined);
    setRenderFailed(false);
    void renderMermaidDiagram(source, id, colorMode)
      .then((renderedSvg) => {
        if (active) setSvg(renderedSvg);
      })
      .catch(() => {
        if (active) {
          setRenderFailed(true);
          setMode("source");
        }
      });

    return () => {
      active = false;
    };
  }, [colorMode, mode, reactId, source]);

  const switchToSource = (event: React.MouseEvent) => {
    event.stopPropagation();
    setRenderFailed(false);
    setMode("source");
  };

  const switchToPreview = (event: React.MouseEvent) => {
    event.stopPropagation();
    setMode("preview");
  };

  return (
    <NodeViewWrapper className="mermaid-code-block my-3" data-language="mermaid">
      {editable && source.trim() !== "" ? (
        <div className="mb-2 flex justify-end" contentEditable={false}>
          {mode === "preview" && !renderFailed ? (
            <SecondaryButton size="xxs" icon={IconPencil} onClick={switchToSource}>
              {t("Edit source")}
            </SecondaryButton>
          ) : (
            <SecondaryButton size="xxs" icon={IconEye} onClick={switchToPreview}>
              {t("Preview")}
            </SecondaryButton>
          )}
        </div>
      ) : null}

      {renderFailed ? (
        <div className="mb-2" contentEditable={false}>
          <ErrorCallout
            message={t("This diagram could not be rendered.")}
            description={t("Check the diagram source and try again.")}
          />
        </div>
      ) : null}

      {mode === "preview" && !renderFailed && source.trim() !== "" ? (
        <div
          className="mermaid-preview overflow-x-auto rounded-lg border border-surface-outline bg-surface-base p-4 text-center"
          contentEditable={false}
          role="img"
          aria-label={t("Diagram preview")}
          aria-busy={svg === undefined}
          dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
        />
      ) : null}

      <pre className={classNames("mermaid-source", { hidden: !showSource })}>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
