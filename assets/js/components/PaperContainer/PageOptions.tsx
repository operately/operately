import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Pages from "@/components/Pages";

import { DivLink } from "../Link";
import classNames from "classnames";
import { TestableElement } from "@/utils/testid";
import { SecondaryButton } from "../Buttons";

type RootProps = TestableElement & { children: React.ReactNode };

const Context = React.createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function Root(props: RootProps) {
  const isScreenBig = Pages.useWindowSizeBiggerOrEqualTo("lg");
  const [outside, inside] = splitChildrenToOutsideAndInside(isScreenBig, props.children);

  const [isOpen, setIsOpen] = React.useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <Context.Provider value={{ isOpen, open, close }}>
      <Body inside={inside} outside={outside} testId={props.testId} />
    </Context.Provider>
  );
}

function Body({ inside, outside, testId }) {
  return (
    <div className="absolute right-0 top-0">
      <div className="absolute right-2.5 top-2.5 flex items-center gap-2">
        <OutsideButtons outsideButtons={outside} />
        {inside.length > 0 && <Trigger testId={testId} />}
      </div>

      {inside.length > 0 && <Dropdown children={inside} />}
    </div>
  );
}

function OutsideButtons({ outsideButtons }) {
  return <div>{outsideButtons}</div>;
}

type LinkProps = TestableElement & {
  icon: React.ElementType;
  title: string;
  to: string;
  keepOutsideOnBigScreen?: boolean;
};

export function Link(props: LinkProps) {
  const isBig = Pages.useWindowSizeBiggerOrEqualTo("lg");

  if (isBig && props.keepOutsideOnBigScreen) {
    return <LinkAsOutsideButton {...props} />;
  } else {
    return <LinkAsDropdownElement {...props} />;
  }
}

function LinkAsOutsideButton(props: LinkProps) {
  return (
    <SecondaryButton size="xs" linkTo={props.to} testId={props.testId}>
      {props.title}
    </SecondaryButton>
  );
}

function LinkAsDropdownElement(props: LinkProps) {
  return (
    <DivLink
      to={props.to}
      className="flex items-center gap-2 py-2 px-4 hover:bg-shade-1 cursor-pointer"
      testId={props.testId}
    >
      {React.createElement(props.icon, { size: 20 })}
      {props.title}
    </DivLink>
  );
}

type ActionProps = TestableElement & {
  icon: React.ElementType;
  title: string;
  onClick: () => void;
};

export function Action({ icon, title, onClick, testId }: ActionProps) {
  const { close } = React.useContext(Context);

  const handleClick = () => {
    close();
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-2 py-2 px-4 hover:bg-shade-1 cursor-pointer"
      data-test-id={testId}
    >
      {React.createElement(icon, { size: 20 })}
      {title}
    </div>
  );
}

function Dropdown({ children }) {
  const { isOpen, close } = React.useContext(Context);
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 z-50 shadow-lg bg-accent-1 w-[300px] text-white-1 font-medium flex flex-col">
      <Close onClick={close} />
      {children}
    </div>
  );
}

function Trigger({ testId }) {
  const { open } = React.useContext(Context);

  const className = classNames({
    "rounded-full border border-surface-outline cursor-pointer": true,
    "p-1 hover:bg-surface-dimmed": true,
  });

  return (
    <div className={className} onClick={open} data-test-id={testId}>
      <Icons.IconDots size={20} />
    </div>
  );
}

function Close({ onClick }) {
  return (
    <div className="flex flex-row-reverse m-4 cursor-pointer">
      <div
        className="p-1 rounded-full border border-content-base"
        onClick={onClick}
        data-test-id="project-options-button"
      >
        <Icons.IconX size={20} />
      </div>
    </div>
  );
}

//
// Split children into two arrays: outside and inside.
//
// Outside children are shown as buttons outside of the dropdown, but only on big screens.
// Inside children are shown inside the dropdown.
//
function splitChildrenToOutsideAndInside(isScreenBig: boolean, children: React.ReactNode) {
  let outsideElements: React.ReactNode[] = [];
  let insideElements: React.ReactNode[] = [];

  React.Children.toArray(children).forEach((child) => {
    if (!React.isValidElement(child)) {
      throw new Error("PageOptions.Root can only have React elements as children");
    } else if (!isScreenBig) {
      insideElements.push(child);
    } else if (!child.props["keepOutsideOnBigScreen"]) {
      insideElements.push(child);
    } else {
      outsideElements.push(child);
    }
  });

  return [outsideElements, insideElements];
}
