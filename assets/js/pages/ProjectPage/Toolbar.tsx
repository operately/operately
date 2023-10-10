import React from "react";
import Button from "@/components/Button";
import { useBoolState } from "@/utils/useBoolState";
import * as Icons from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import * as Projects from "@/graphql/Projects";

export default function Toolbar({ project, refetch, me }) {
  if (project.champion?.id === me.id) {
    return <ChampionToolbar project={project} />;
  }

  return null;
}

function ChampionToolbar({ project }) {
  const [isOpen, _, open, close] = useBoolState(false);

  if (isOpen) {
    return <ChampionToolbarOpen project={project} onClose={close} />;
  } else {
    return <ChampionToolbarClosed onOpen={open} />;
  }
}

function ChampionToolbarOpen({ project, onClose }) {
  const navigate = useNavigate();

  const archiveForm = Projects.useArchiveForm({
    variables: {
      projectId: project.id,
    },
    onSuccess: () => {
      onClose();
      navigate("/projects");
    },
  });

  return (
    <div className="bg-dark-2 border-y border-shade-2 px-8 py-4 -mx-8 cursor-default" data-test-id="champion-toolbar">
      <div className="flex items-center gap-1" onClick={onClose}>
        <Icons.IconChevronDown className="text-white-2 -ml-5 block" size={16} />
        <div className="font-semibold">Champion's Toolbar</div>
      </div>

      <div className="text-white-2 text-sm mb-4">Tools for managing the project. Only you can see this.</div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={archiveForm.submit}
          loading={archiveForm.loading}
          data-test-id="archive-project-button"
        >
          Archive this project
        </Button>
      </div>
    </div>
  );
}

function ChampionToolbarClosed({ onOpen }) {
  return (
    <div
      className="flex items-center gap-1 bg-dark-2 border-y border-shade-2 px-8 py-4 -mx-8 cursor-default"
      onClick={onOpen}
      data-test-id="champion-toolbar"
    >
      <Icons.IconChevronRight className="text-white-2 -ml-5 block" size={16} />
      <div className="font-semibold">Champion's Toolbar</div>
    </div>
  );
}
