import React from "react";

export function ToggleTestIds() {
  const [show, setShow] = React.useState(false);
  const status = show ? "ON" : "OFF";
  const color = show ? "text-green-500" : "text-white-1";

  const toggle = () => setShow(!show);
  const className = color + " cursor-pointer";

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
    <div className="">
      TestIDs [
      <span className={className} onClick={toggle}>
        {status}
      </span>
      ]
      {show && (
        <style>
          {`
          [data-test-id]:not([data-test-id-annotation]) {
            outline: ${show ? "1px solid red" : "none"};
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
    </div>
  );
}
