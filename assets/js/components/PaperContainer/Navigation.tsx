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

export function Navigation({ items, testId }: { items: Item[]; testId?: string }) {
  const className = classNames(
    "bg-surface-dimmed",
    "flex items-center flex-wrap",
    "justify-center gap-1",
    "px-2 pt-2 pb-1 mx-0 sm:mx-10",
    "font-semibold rounded-t",
    "border-b sm:border-b-0 sm:border-t sm:border-x border-surface-outline",
  );

  return (
    <div className={className} data-test-id={testId}>
      {items.map((item, index) => (
        <>
          {index > 0 && <NavSeparator key={`separator-${index}`} />}
          <NavItem item={item} key={item.to} />
        </>
      ))}
    </div>
  );
}

interface NavItemProps {
  item: Item;
}

function NavItem({ item }: NavItemProps) {
  return (
    <Link to={item.to} testId={createTestId("nav-item", item.label)}>
      {item.label}
    </Link>
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
