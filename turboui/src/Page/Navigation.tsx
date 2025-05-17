import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Icons from "@tabler/icons-react";
import * as React from "react";

import { BlackLink, Link } from "../Link";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

export namespace Navigation {
  export interface Item {
    to: string;
    label: string;
  }

  export interface Props {
    items: Item[];
  }
}

const navigationClassName = classNames(
  "text-sm",
  "flex items-center gap-1",
  "px-4 pt-3 pb-2",
  "rounded-t",
  "bg-zinc-50",
);

export function Navigation({ items }: Navigation.Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hiddenCount = useHiddenItemCounter(containerRef, items);

  return (
    <div className={navigationClassName} ref={containerRef}>
      {hiddenCount > 0 && <HiddenItems items={items} hiddenCount={hiddenCount} />}

      {items.slice(hiddenCount).map((item, index) => (
        <NavItem key={index + item.label} item={item} index={index + hiddenCount} last={index === items.length - 1} />
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

function HiddenItems({ items, hiddenCount }: { items: Navigation.Item[]; hiddenCount: number }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="border border-surface-outline px-1 rounded">
        <Icons.IconDots className="cursor-pointer shrink-0" size={18} />
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

function NavItem({ item, index, last }: { item: Navigation.Item; index: number }) {
  const className = classNames("truncate", {
    "font-bold": last,
  });

  return (
    <React.Fragment key={`fragment-${index}`}>
      {index > 0 && <NavSeparator key={`separator-${index}`} />}

      <BlackLink to={item.to} testId={createTestId("nav-item", item.label)} className={className} underline="hover">
        {item.label}
      </BlackLink>
    </React.Fragment>
  );
}

function NavSeparator() {
  const iconSize = 12;

  return (
    <div className="shrink-0 text-content-dimmed">
      <Icons.IconSlash size={iconSize} />
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

function useHiddenItemCounter(containerRef: React.RefObject<HTMLDivElement>, items: Navigation.Item[]) {
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
    if ("iIljtf".includes(char)) width += 6; // narrow chars
    else if ("mwWM".includes(char)) width += 13; // wide chars
    else width += 9; // average chars
  }

  return width;
}
