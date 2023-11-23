import * as React from "react";
import * as Icons from "@tabler/icons-react";

export function Options({ form }) {
  const [showOptions, setShowOptions] = React.useState(false);

  const openOptions = () => setShowOptions(true);
  const closeOptions = () => setShowOptions(false);

  return (
    <div>
      <OpenOptions onClick={openOptions} />

      {showOptions && <OptionsDropdown closeOptions={closeOptions} form={form} />}
    </div>
  );
}

function OptionsDropdown({ closeOptions, form }) {
  return (
    <div className="absolute right-0 top-0 z-50 shadow-lg bg-accent-1 w-[250px] text-white-1 font-medium flex flex-col">
      <CloseOptions onClick={closeOptions} />
      <EditName form={form} closeOptions={closeOptions} />
      <ArchiveMilestone form={form} closeOptions={closeOptions} />
    </div>
  );
}

function ArchiveMilestone({ form, closeOptions }) {
  const onClick = React.useCallback(() => {
    form.archive();
    closeOptions();
  }, [form, closeOptions]);

  return (
    <Option
      icon={Icons.IconArchive}
      title="Archive this milestone"
      onClick={onClick}
      dataTestId="archive-milestone-button"
    />
  );
}

function EditName({ form, closeOptions }) {
  const onClick = React.useCallback(() => {
    form.title.startEditing();
    closeOptions();
  }, [form.title, closeOptions]);

  return <Option icon={Icons.IconEdit} title="Edit title" onClick={onClick} dataTestId="edit-project-name-button" />;
}

function Option({ icon, title, onClick, dataTestId }) {
  return (
    <div
      className="flex items-center gap-2 py-2 px-4 hover:bg-shade-1 cursor-pointer"
      onClick={onClick}
      data-test-id={dataTestId}
    >
      {React.createElement(icon, { size: 20 })}
      {title}
    </div>
  );
}

function OpenOptions({ onClick }) {
  return (
    <div
      className="p-1 rounded-full border border-shade-3 cursor-pointer"
      onClick={onClick}
      data-test-id="project-options-button"
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
