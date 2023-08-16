import React from "react";

import classnames from "classnames";

import * as Icons from "@tabler/icons-react";
import * as Popover from "@radix-ui/react-popover";

interface ContextDescriptor {
  editable: boolean;
  onSelected: (value: string) => void;
  activeValue: string;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export function SelectBox({
  children,
  editable,
  onSelected = () => null,
  activeValue,
  open = undefined,
  onOpenChange = undefined,
}) {
  return (
    <Context.Provider value={{ editable, onSelected, activeValue }}>
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <div
          className={classnames({
            "flex items-center gap-2 rounded px-1.5 py-0.5 mt-1": true,
            "cursor-pointer": editable,
            "hover:shadow hover:bg-white-1/[3%]": editable,
          })}
        >
          {children}
        </div>
      </Popover.Root>
    </Context.Provider>
  );
}

export function Trigger({ children, ...props }) {
  const { editable } = React.useContext(Context) as ContextDescriptor;

  if (editable) {
    return <Popover.Trigger {...props}>{children}</Popover.Trigger>;
  } else {
    return <div {...props}>{children}</div>;
  }
}

export function Popup({ children }) {
  return (
    <Popover.Portal>
      <Popover.Content className="outline-none">
        <div className="p-1 bg-dark-3 rounded-lg shadow-lg border border-dark-5 mt-2">{children}</div>
      </Popover.Content>
    </Popover.Portal>
  );
}

export function Option({ children, value, ...props }) {
  const { onSelected, activeValue } = React.useContext(Context) as ContextDescriptor;

  const handleSelect = () => {
    if (activeValue !== value) {
      onSelected(value);
    }
  };

  return (
    <div
      className="flex justify-between items-center rounded px-1.5 py-0.5 mt-1 hover:bg-white-1/[3%] cursor-pointer"
      onClick={handleSelect}
      {...props}
    >
      <div className="flex items-center gap-3">{children}</div>

      {activeValue === value && <Icons.IconCheck size={16} className="text-white-1" />}
    </div>
  );
}

export function Divider() {
  return <div className="border-t border-white-2/5 my-1" />;
}
