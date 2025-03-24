import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Pages from "@/components/Pages";

import { Link } from "@/components/Link";
import classNames from "classnames";
import { createTestId } from "@/utils/testid";

export function NavigateBack({ to, title }) {
  return (
    <div className="flex items-center justify-center mb-4">
      <Link to={to}>
        <Icons.IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
        {title}
      </Link>
    </div>
  );
}

interface Item {
  to: string;
  label: string;
}

const navigationClassName = classNames(
  "bg-surface-dimmed",
  "flex items-center gap-1 justify-center",
  "px-2 pt-2 pb-1 mx-0 sm:mx-10",
  "font-semibold rounded-t",
  "border-b sm:border-b-0 sm:border-t sm:border-x border-surface-outline",
);

export function Navigation({ items, testId }: { items: Item[]; testId?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hiddenCount, setHiddenCount] = React.useState(0);

  function handleResize() {
    window.requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const width = container.getBoundingClientRect().width;
      const itemWidths = items.map((item) => estimatedTextWidth(item.label));
      const totalItemWidths = itemWidths.reduce((acc, cur) => acc + cur, 0);
      const separators = (items.length - 1) * 25;

      let overflow = totalItemWidths + separators - width;
      let hidden = 0;

      console.log("before", width, itemWidths, overflow);

      while (overflow > 0 && itemWidths.length > 1) {
        const last = itemWidths.shift();
        overflow -= last!;
        hidden++;
      }

      console.log("after", width, itemWidths, overflow, hidden);
      setHiddenCount(hidden);
    });
  }

  React.useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [containerRef, items]);

  console.log("hiddenCount", hiddenCount);

  return (
    <div className={navigationClassName} data-test-id={testId} ref={containerRef}>
      {items.slice(hiddenCount).map((item, index) => (
        <NavItem key={index + item.label} item={item} index={index} />
      ))}
    </div>
  );
}

function NavItem({ item, index }: { item: Item; index: number }) {
  const className = classNames("truncate");

  return (
    <React.Fragment key={`fragment-${index}`}>
      {index > 0 && <NavSeparator key={`separator-${index}`} />}

      <Link to={item.to} testId={createTestId("nav-item", item.label)} className={className}>
        {item.label}
      </Link>
    </React.Fragment>
  );
}

function NavSeparator() {
  const breakpoint = Pages.useWindowSizeBreakpoints();
  const iconSize = breakpoint === "xs" ? 12 : 16;

  return (
    <div className="shrink-0">
      <Icons.IconSlash size={iconSize} />
    </div>
  );
}

function estimatedTextWidth(text: string) {
  let width = 0;

  for (const char of text) {
    if ("iIljtf".includes(char))
      width += 6; // narrow chars
    else if ("mwWM".includes(char))
      width += 12; // wide chars
    else width += 9; // average chars
  }

  return width;
}
