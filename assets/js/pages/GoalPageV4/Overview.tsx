import * as React from "react";
import { usePageMode } from ".";

export function Overview() {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = React.useState(
    "Our strategic goal is to thoughtfully expand our market presence by following clear customer demand signals and maintaining our commitment to product excellence. We will achieve this by focusing on the following key areas: 1. Expanding our product line to include more options for our customers. 2. Increasing our marketing efforts to reach new customers. 3. Improving our customer service to retain existing customers.",
  );

  const mode = usePageMode();

  function adjustHeight() {
    if (!ref.current) return;

    ref.current.style.height = "inherit";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }

  React.useEffect(() => {
    setTimeout(() => {
      adjustHeight();
    }, 0);
  }, [content, mode]);

  if (mode === "edit") {
    return (
      <div className="w-full border-stroke-base rounded mt-2">
        <textarea
          ref={ref}
          className="break-words ring-0 padding-0 focus:ring-0 focus:outline-none w-full p-0 border-none focus:border-none resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
    );
  } else {
    return (
      <div className="break-words mt-2 line-clamp-2">
        <div>{content}</div>
      </div>
    );
  }
}
