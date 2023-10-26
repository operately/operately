import * as React from "react";
import * as Projects from "@/graphql/Projects";
import * as Icons from "@tabler/icons-react";

import { useNavigateTo } from "@/routes/useNavigateTo";

export default function Options({ project }) {
  const [showOptions, setShowOptions] = React.useState(false);

  const openOptions = () => setShowOptions(true);
  const closeOptions = () => setShowOptions(false);

  return (
    <div>
      <OpenOptions onClick={openOptions} />

      {showOptions && <OptionsDropdown project={project} closeOptions={closeOptions} />}
    </div>
  );
}

function OptionsDropdown({ project, closeOptions }) {
  return (
    <div className="absolute right-0 top-0 z-50 shadow-lg bg-blue-400 w-[250px] text-dark-1 font-medium flex flex-col">
      <CloseOptions onClick={closeOptions} />
      <EditProjectName project={project} />
      <ArchiveProject project={project} />
    </div>
  );
}

function ArchiveProject({ project }) {
  const navigateToProjectList = useNavigateTo("/projects");

  const archiveForm = Projects.useArchiveForm({
    variables: {
      projectId: project.id,
    },
    onSuccess: () => navigateToProjectList(),
  });

  return (
    <Option
      icon={<Icons.IconArchiveFilled size={20} />}
      title="Archive this project"
      onClick={archiveForm.submit}
      dataTestId="archive-project-button"
    />
  );
}

function EditProjectName({ project }) {
  const navigateToEdit = useNavigateTo(`/projects/${project.id}/edit/name`);

  return (
    <Option
      icon={<Icons.IconEdit size={20} />}
      title="Edit project name"
      onClick={navigateToEdit}
      dataTestId="edit-project-name-button"
    />
  );
}

function Option({ icon, title, onClick, dataTestId }) {
  return (
    <div
      className="flex items-center gap-2 py-2 px-4 hover:bg-shade-1 cursor-pointer"
      onClick={onClick}
      data-test-id={dataTestId}
    >
      {icon}
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
      <div className="p-1 rounded-full border border-dark-1" onClick={onClick} data-test-id="project-options-button">
        <Icons.IconX size={20} />
      </div>
    </div>
  );
}
