import React from "react";

export interface FloatingComment {
  id: string;
  from?: number;
  selectionRange?: Range | null;
  content: React.ReactNode;
}

// Cards scroll with the page. Push neighboring cards down only enough to avoid overlap.
export function FloatingComments({
  items,
  contentRef,
}: {
  items: FloatingComment[];
  contentRef: React.RefObject<HTMLDivElement>;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ordered = [...items].sort((a, b) => (a.from ?? Infinity) - (b.from ?? Infinity));

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const cards = Array.from(container.children) as HTMLElement[];
    const position = () => {
      const origin = container.getBoundingClientRect().top;
      const highlights = Array.from(content.querySelectorAll<HTMLElement>("[data-inline-thread]"));
      let bottom = 0;

      ordered.forEach((item, index) => {
        const card = cards[index];
        if (!card) return;
        const highlight = highlights.find((element) => element.dataset.inlineThread?.split(" ").includes(item.id));
        const selection = item.selectionRange?.commonAncestorContainer.isConnected ? item.selectionRange : null;
        const passageTop = selection?.getBoundingClientRect().top ?? highlight?.getBoundingClientRect().top;
        const desiredTop = (passageTop ?? content.getBoundingClientRect().bottom) - origin;
        const top = Math.max(bottom, desiredTop);
        card.style.marginTop = `${top - bottom}px`;
        bottom = top + card.getBoundingClientRect().height + 12;
      });
    };

    position();

    const observer = new ResizeObserver(position);
    observer.observe(content);
    cards.forEach((card) => observer.observe(card));
    window.addEventListener("resize", position);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
    };
  });

  return (
    <div
      ref={containerRef}
      className="absolute left-full top-0 ml-6 w-[28rem] flex flex-col gap-3 pb-8"
      data-test-id="inline-comments-floating"
    >
      {ordered.map((item) => (
        <div key={item.id}>{item.content}</div>
      ))}
    </div>
  );
}
