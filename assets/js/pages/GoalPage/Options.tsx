import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { DivLink } from "@/components/Link";

export function Options({ goal }) {
  const [showOptions, setShowOptions] = React.useState(false);

  const openOptions = () => setShowOptions(true);
  const closeOptions = () => setShowOptions(false);

  return (
    <div>
      <OpenOptions onClick={openOptions} testId="goal-options" />

      {showOptions && <OptionsDropdown goal={goal} closeOptions={closeOptions} />}
    </div>
  );
}

function OptionsDropdown({ goal, closeOptions }) {
  return (
    <div className="absolute right-0 top-0 z-50 shadow-lg bg-accent-1 w-[300px] text-white-1 font-medium flex flex-col">
      <CloseOptions onClick={closeOptions} testId="close-goal-options" />

      {!goal.isArchived && (
        <Option icon={Icons.IconTrash} title="Archive" link={`/goals/${goal.id}/archive`} dataTestId="archive-goal" />
      )}
    </div>
  );
}

function Option({ icon, title, link, dataTestId }) {
  return (
    <DivLink
      className="flex items-center gap-2 py-2 px-4 hover:bg-shade-1 cursor-pointer"
      to={link}
      data-test-id={dataTestId}
    >
      {React.createElement(icon, { size: 20 })}
      {title}
    </DivLink>
  );
}

function OpenOptions({ onClick, testId }) {
  return (
    <div className="p-1 rounded-full border border-shade-3 cursor-pointer" onClick={onClick} data-test-id={testId}>
      <Icons.IconDots size={20} />
    </div>
  );
}

function CloseOptions({ onClick, testId }) {
  return (
    <div className="flex flex-row-reverse m-4 cursor-pointer">
      <div className="p-1 rounded-full border border-content-base" onClick={onClick} data-test-id={testId}>
        <Icons.IconX size={20} />
      </div>
    </div>
  );
}
