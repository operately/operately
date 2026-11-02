import React from "react";
import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "../Button";
import { IconMessagePlus } from "../icons";

export function SelectionAction({
  range,
  contentRef,
  mobile,
  onAdd,
}: {
  range: Range;
  contentRef: React.RefObject<HTMLElement>;
  mobile: boolean;
  onAdd: () => void;
}) {
  const { t } = useTranslation();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reference = {
      getBoundingClientRect: () => {
        if (mobile || !contentRef.current) return range.getBoundingClientRect();

        // Center the button beside the selection's first line, outside the text column.
        const line = range.getClientRects()[0] ?? range.getBoundingClientRect();
        return new DOMRect(contentRef.current.getBoundingClientRect().right, line.top, 0, line.height);
      },
      contextElement: contentRef.current ?? undefined,
    };
    let disposed = false;
    const cleanup = autoUpdate(reference, element, () => {
      void computePosition(reference, element, {
        strategy: "fixed",
        placement: mobile ? "bottom" : "right",
        middleware: [offset(mobile ? 8 : 4), ...(mobile ? [flip()] : []), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        if (!disposed) Object.assign(element.style, { left: `${x}px`, top: `${y}px`, visibility: "visible" });
      });
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [range, contentRef, mobile]);

  return (
    <div
      ref={ref}
      className="fixed z-40"
      style={{ visibility: "hidden" }}
      onPointerDown={(event) => event.preventDefault()}
    >
      <PrimaryButton
        size="xs"
        ariaLabel={t("Add comment")}
        onClick={onAdd}
        testId="inline-add-selection"
        className={`shadow-md whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-1 ${mobile ? "min-h-10" : "min-h-8"}`}
      >
        <span className="flex items-center justify-center gap-1.5">
          <IconMessagePlus size={18} aria-hidden="true" />
          {t("Add comment")}
        </span>
      </PrimaryButton>
    </div>
  );
}
