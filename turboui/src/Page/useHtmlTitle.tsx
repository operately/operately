import React from "react";

export function useHtmlTitle(title: string | string[]) {
  if (!title) {
    throw new Error("Page title cannot be null");
  }

  const titleArray = Array.isArray(title) ? title : [title];

  if (titleArray.length === 0) {
    throw new Error("Page title cannot be empty");
  }

  if (titleArray.some((t) => t === null || t === undefined)) {
    throw new Error("Page title cannot contain null or undefined");
  }

  React.useEffect(() => {
    document.title = titleArray.join(" / ");
  }, [titleArray]);
}
