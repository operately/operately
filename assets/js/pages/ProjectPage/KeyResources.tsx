import React from "react";

import { KeyResource, useAddKeyResourceMutation } from "@/graphql/Projects/key_resources";

import * as Icons from "@tabler/icons-react";
import * as Projects from "@/graphql/Projects";
import * as Forms from "@/components/Form";

import Modal from "@/components/Modal";

interface Props {
  project: Projects.Project;
  editable: boolean;
  refetch: () => void;
}

export default function KeyResources({ project, editable, refetch }: Props): JSX.Element {
  return (
    <div className="flex flex-col gap-1 mb-8 border-b border-dark-5 py-4 relative">
      <div className="font-bold flex justify-between items-center">
        Key Resources
        {editable && <AddResource project={project} refetch={refetch} />}
      </div>

      <Body project={project} />
    </div>
  );
}

function Body({ project }: { project: Projects.Project }): JSX.Element {
  if (project.keyResources.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {project.keyResources.map((kr) => (
        <Link resource={kr} key={kr.id} />
      ))}
    </div>
  );
}

function EmptyState() {
  return <div className="text-white-2">No key resources.</div>;
}

function Link({ resource }: { resource: KeyResource }): JSX.Element {
  return (
    <a
      href={resource.link}
      target="_blank"
      className="font-medium bg-shade-1 px-3 py-2 flex items-center gap-2 rounded-lg cursor-pointer text-sm"
    >
      <LinkIcon type={resource.type} />
      {resource.title}
    </a>
  );
}

function LinkIcon({ type }) {
  switch (type) {
    case "github":
      return <Icons.IconBrandGithub size={20} className="text-pink-400" />;
    default:
      return <Icons.IconLink size={20} className="text-pink-400" />;
  }
}

function AddResource({ project, refetch }) {
  const [isModalOpen, setIsModalOpen]: [boolean, any] = React.useState(false);

  const openModal = () => setIsModalOpen(true);
  const hideModal = () => setIsModalOpen(false);

  const [title, setTitle] = React.useState("");
  const [link, setLink] = React.useState("");

  const valid = title.length > 0 && link.length > 0;

  const [add, { loading }] = useAddKeyResourceMutation({
    onCompleted: () => {
      hideModal();
      setTitle("");
      setLink("");
      refetch();
    },
  });

  const handleSubmit = () => {
    add({
      variables: {
        input: {
          projectId: project.id,
          title,
          link,
          type: "generic",
        },
      },
    });
  };

  return (
    <>
      <div
        className="text-white-2 hover:text-white-1 cursor-pointer"
        onClick={openModal}
        data-test-id="add-key-resource"
      >
        <Icons.IconPlus size={20} />
      </div>

      <Modal title={"Add a key resource"} isOpen={isModalOpen} hideModal={hideModal} minHeight="200px">
        <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={valid}>
          <Forms.TextInput value={title} onChange={setTitle} label="Title" placeholder="e.g. GitHub Repository" />
          <Forms.TextInput
            value={link}
            onChange={setLink}
            label="URL"
            placeholder="e.g. https://github.com/operately/operately"
          />

          <Forms.SubmitArea>
            <Forms.SubmitButton data-test-id="save-key-resource">Add</Forms.SubmitButton>
          </Forms.SubmitArea>
        </Forms.Form>
      </Modal>
    </>
  );
}
