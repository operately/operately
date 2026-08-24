import React from "react";

import { IconHash } from "turboui";
import { DevPill } from "./DevPill";

export function ToggleTestIds() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (!show) return;

    document.querySelectorAll("input[data-test-id][type='text']").forEach((el) => {
      const message = document.createElement("div");
      message.setAttribute("data-test-id", el.getAttribute("data-test-id")!);
      message.setAttribute("data-test-id-annotation", "");
      (el.parentNode! as HTMLElement).insertBefore(message, el);
    });

    return () => {
      document.querySelectorAll("[data-test-id-annotation]").forEach((el) => {
        el.remove();
      });
    };
  }, [show]);

  return (
    <>
      <DevPill active={show} onClick={() => setShow(!show)} title="Outline elements that have a data-test-id">
        <IconHash size={12} />
        test ids
      </DevPill>

      {show && (
        <style>
          {`
          [data-test-id]:not([data-test-id-annotation]) {
            outline: 1px solid red;
          }

          [data-test-id]::before {
            content: attr(data-test-id);
            position: absolute;
            z-index: 9999;
            background: red !important;
            color: white;
            font-size: 12px;
            padding: 1px 3px;
            white-space: nowrap;
            font-weight: bold;
            text-transform: none;
          }
        `}
        </style>
      )}
    </>
  );
}
