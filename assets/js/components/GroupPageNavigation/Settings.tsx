import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { DivLink } from "../Link";

export function Settings({ groupId }) {
  const [showOptions, setShowOptions] = React.useState(false);

  const openOptions = () => setShowOptions(true);
  const closeOptions = () => setShowOptions(false);

  return (
    <div>
      <OpenOptions onClick={openOptions} />

      {showOptions && <OptionsDropdown groupId={groupId} closeOptions={closeOptions} />}
    </div>
  );
}

// <Option
//   icon={Icons.IconId}
//   title="Edit name and purpose"
//   link={`/spaces/${groupId}/edit`}
//   dataTestId="edit-name-and-purpose"
// />

// <Option
//   icon={Icons.IconLock}
//   title="Change Visibility"
//   link={`/spaces/${groupId}/visibility`}
//   dataTestId="change-visiblity"
// />

function OptionsDropdown({ groupId, closeOptions }) {
  return (
    <div className="absolute right-0 top-0 z-50 shadow-lg bg-accent-1 w-[300px] text-white-1 font-medium flex flex-col">
      <CloseOptions onClick={closeOptions} />

      <Option
        icon={Icons.IconPencil}
        title="Edit name and purpose"
        link={`/spaces/${groupId}/edit`}
        dataTestId="edit-name-and-purpose"
      />

      <Option
        icon={Icons.IconUserPlus}
        title="Add/Remove members"
        link={`/spaces/${groupId}/members`}
        dataTestId="add-remove-members"
      />

      <Option
        icon={Icons.IconPaint}
        title="Change Appearance"
        link={`/spaces/${groupId}/appearance`}
        dataTestId="change-appearance"
      />
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

function OpenOptions({ onClick }) {
  return (
    <div
      className="p-1 rounded-full border border-shade-3 cursor-pointer"
      onClick={onClick}
      data-test-id="space-settings"
    >
      <Icons.IconDots size={20} />
    </div>
  );
}

function CloseOptions({ onClick }) {
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
