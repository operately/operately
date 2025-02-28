import * as React from "react";

export function Overview() {
  const [content, setContent] = React.useState(
    "Our strategic goal is to thoughtfully expand our market presence by following clear customer demand signals and maintaining our commitment to product excellence. We will achieve this by focusing on the following key areas: 1. Expanding our product line to include more options for our customers. 2. Increasing our marketing efforts to reach new customers. 3. Improving our customer service to retain existing customers.",
  );
  const [tempContent, setTempContent] = React.useState(content);
  const [isEditing, setIsEditing] = React.useState(false);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    setContent(tempContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const startEditing = () => {
    setContent(tempContent);
    setIsEditing(true);

    setTimeout(() => {
      adjustHeight();
      if (!ref.current) return;
      ref.current.focus();
      ref.current.selectionStart = ref.current.value.length;
    }, 10);
  };

  const handleSaveAndCancel = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  function adjustHeight() {
    if (!ref.current) return;

    ref.current.style.height = "inherit";
    ref.current.style.height = `${ref.current.scrollHeight + 40}px`;
  }

  if (isEditing) {
    return (
      <div className="w-full border-stroke-base rounded mt-2">
        <textarea
          ref={ref}
          className="break-words ring-0 padding-0 focus:ring-0 focus:outline-none w-full p-0 border-none focus:border-none"
          value={tempContent}
          onChange={(e) => setTempContent(e.target.value)}
          onKeyDown={handleSaveAndCancel}
          onKeyUp={adjustHeight}
          onBlur={handleSave}
          autoFocus
        />
      </div>
    );
  } else {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="uppercase text-xs font-bold tracking-wider">Overview</div>
        </div>
        <div className="">
          <div
            className="break-words mt-2 hover:bg-surface-highlight cursor-pointer line-clamp-2"
            onClick={startEditing}
          >
            <div>{content}</div>
          </div>
        </div>
      </div>
    );
  }
}
