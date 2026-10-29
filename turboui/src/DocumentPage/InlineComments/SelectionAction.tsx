import React from "react";
import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { useTranslation } from "react-i18next";
import { SecondaryButton } from "../../Button";

export function SelectionAction({ range, onAdd }: { range: Range; onAdd: () => void }) {
  const { t } = useTranslation();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reference = {
      getBoundingClientRect: () => range.getBoundingClientRect(),
      contextElement: range.commonAncestorContainer.parentElement ?? undefined,
    };
    let disposed = false;
    const cleanup = autoUpdate(reference, element, () => {
      void computePosition(reference, element, {
        strategy: "fixed",
        placement: "bottom",
        middleware: [offset(8), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        if (!disposed) Object.assign(element.style, { left: `${x}px`, top: `${y}px`, visibility: "visible" });
      });
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [range]);

  return (
    <div
      ref={ref}
      className="fixed z-40"
      style={{ visibility: "hidden" }}
      onPointerDown={(event) => event.preventDefault()}
    >
      <SecondaryButton size="xxs" onClick={onAdd} testId="inline-add-selection">
        {t("Add comment")}
      </SecondaryButton>
    </div>
  );
}
