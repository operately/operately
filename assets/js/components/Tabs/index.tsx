import * as React from "react";

import { DivLink } from "@/components/Link";
import classNames from "classnames";
import { usePaperSizeHelpers } from "@/components/PaperContainer";

interface TabsContext {
  activeTab: string;
}

const Context = React.createContext<TabsContext>({ activeTab: "" });

interface TabsProps {
  activeTab: string;
  children?: React.ReactNode;
}

export function Root(props: TabsProps) {
  const { negateHorizontalPadding } = usePaperSizeHelpers();

  const className = "flex gap-2 border-b border-surface-outline mt-6" + " " + negateHorizontalPadding;

  return (
    <Context.Provider value={{ activeTab: props.activeTab }}>
      <div className={className}>{props.children}</div>
    </Context.Provider>
  );
}

export function Tab({ id, title, linkTo }: { title: string; linkTo: string; id: string }) {
  const { activeTab } = React.useContext(Context);
  const isActive = activeTab === id;

  const className = classNames("border-surface-outline rounded-t px-4 py-1 -mb-px cursor-pointer bg-surface", {
    "border-x border-t font-medium": isActive,
    border: !isActive,
    "hover:text-content": !isActive,
  });

  return (
    <DivLink to={linkTo} className={className} testId={`tab-${id}`}>
      {title}
    </DivLink>
  );
}
