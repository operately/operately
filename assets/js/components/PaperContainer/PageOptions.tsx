import * as React from "react";
import * as Icons from "@tabler/icons-react";
import { DivLink } from "../Link";
import classNames from "classnames";

interface RootProps {
  position?: "top-right";
  noBorder?: boolean;
  children: React.ReactNode;
  testId?: string;
}

export const Context = React.createContext({
  close: () => {},
});

export function Root(props: RootProps) {
  const [showOptions, setShowOptions] = React.useState(false);

  const openOptions = () => setShowOptions(true);
  const closeOptions = () => setShowOptions(false);

  const className = React.useMemo(() => {
    if (props.position === "top-right") {
      return "absolute right-0 top-0";
    }

    return "";
  }, [props.position]);

  return (
    <Context.Provider value={{ close: closeOptions }}>
      <div className={className}>
        <Open onClick={openOptions} noBorder={props.noBorder} testId={props.testId} position={props.position} />

        {showOptions && <Dropdown closeOptions={closeOptions} children={props.children} />}
      </div>
    </Context.Provider>
  );
}

export function Link({ icon, title, to, dataTestId }) {
  return (
    <DivLink
      to={to}
      className="flex items-center gap-2 py-2 px-4 hover:bg-shade-1 cursor-pointer"
      data-test-id={dataTestId}
    >
      {React.createElement(icon, { size: 20 })}
      {title}
    </DivLink>
  );
}

export function Action({ icon, title, onClick, dataTestId }) {
  const { close } = React.useContext(Context);

  const handleClick = () => {
    close();
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-2 py-2 px-4 hover:bg-shade-1 cursor-pointer"
      data-test-id={dataTestId}
    >
      {React.createElement(icon, { size: 20 })}
      {title}
    </div>
  );
}

function Dropdown({ closeOptions, children }) {
  return (
    <div className="absolute right-0 top-0 z-50 shadow-lg bg-accent-1 w-[300px] text-white-1 font-medium flex flex-col">
      <Close onClick={closeOptions} />
      {children}
    </div>
  );
}

function Open({ onClick, noBorder, testId, position }) {
  const className = classNames({
    "p-1 rounded-full border border-stroke-base cursor-pointer": true,
    "border-transparent": noBorder,
    "hover:border-surface-outline transition-colors duration-200": !noBorder,
    "absolute right-5 top-5": position === "top-right",
  });

  return (
    <div className={className} onClick={onClick} data-test-id={testId}>
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
