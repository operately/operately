import * as React from "react";
import { IconArrowLeft, IconDots, IconSlash } from "turboui";
import * as Pages from "@/components/Pages";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { Link } from "turboui";
import classNames from "classnames";
import { createTestId } from "@/utils/testid";

export function NavigateBack({ to, title }) {
  return (
    <div className="flex items-center justify-center mb-4">
      <Link to={to}>
        <IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
        {title}
      </Link>
    </div>
  );
}

interface Item {
  to: string;
  label: string;
}

export { Item as NavigationItem };

const navigationClassName = classNames(
  "bg-surface-dimmed",
  "flex items-center gap-1 justify-center",
  "px-2 pt-2 pb-1 mx-0 sm:mx-10",
  "font-semibold rounded-t",
  "border-b sm:border-b-0 sm:border-t sm:border-x border-surface-outline",
);

export function Navigation({ items, testId }: { items: Item[]; testId?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hiddenCount = useHiddenItemCounter(containerRef, items);

  return (
    <div className={navigationClassName} data-test-id={testId} ref={containerRef}>
      {hiddenCount > 0 && <HiddenItems items={items} hiddenCount={hiddenCount} />}

      {items.slice(hiddenCount).map((item, index) => (
        <NavItem key={index + item.label} item={item} index={index + hiddenCount} />
      ))}
    </div>
  );
}

const menuContentClass = classNames(
  "max-w-[100vw]", // on mobile screens, the dropdown should be full width
  "relative",
  "sm:rounded-md mt-1 z-50 px-1 py-1.5",
  "shadow-xl ring-1 transition ring-surface-outline",
  "focus:outline-none",
  "bg-surface-base",
  "animateMenuSlideDown",
);

function HiddenItems({ items, hiddenCount }: { items: Item[]; hiddenCount: number }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="border border-surface-outline px-1 rounded">
        <IconDots className="cursor-pointer shrink-0" size={18} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={menuContentClass} align="start">
          {items.slice(0, hiddenCount).map((item, index) => (
            <Link
              key={index + item.label}
              to={item.to}
              testId={createTestId("nav-item", item.label)}
              className="block px-2 py-1"
            >
              {item.label}
            </Link>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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
      <IconSlash size={iconSize} />
    </div>
  );
}

//
// This hook calculates how many items should be hidden in the navigation bar
// based on the available width of the container and the width of the items.
//
// The calculation is done by removing items from the left side of the list
// until the total width of the items is less than the container width.
// This is done when you open the page and on every resize event.
//
// The calculation is dones based on estimated text width, and estimated width
// of the separators between the items. This is not 100% accurate, but it's
// good enough for our use case.
//

function useHiddenItemCounter(containerRef: React.RefObject<HTMLDivElement>, items: Item[]) {
  const [hiddenCount, setHiddenCount] = React.useState(0);

  function handleResize() {
    window.requestAnimationFrame(() => {
      if (!containerRef.current) return;

      // Get the actual width of the container
      const container = containerRef.current;
      const width = container.getBoundingClientRect().width;

      // Get the estimated width of the items and separators
      const itemWidths = items.map((item) => estimatedTextWidth(item.label));
      const totalItemWidths = itemWidths.reduce((acc, cur) => acc + cur, 0);
      const separators = (items.length - 1) * 25;
      const hiddenMenuWidth = 40;

      // Calculate the overflow and how many items should be hidden
      let overflow = totalItemWidths + separators + hiddenMenuWidth - width;
      let hidden = 0;

      //
      // Remove items from the left side until the overflow is less than 0.
      // Never hide the last item.
      //
      while (overflow > 0 && itemWidths.length > 1) {
        const last = itemWidths.shift();
        overflow -= last!;
        hidden++;
      }

      setHiddenCount(hidden);
    });
  }

  React.useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [containerRef, items]);

  return hiddenCount;
}

function estimatedTextWidth(text: string) {
  let width = 0;

  for (const char of text) {
    if ("iIljtf".includes(char))
      width += 6; // narrow chars
    else if ("mwWM".includes(char))
      width += 13; // wide chars
    else width += 9; // average chars
  }

  return width;
}
