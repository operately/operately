import React from "react";

import {
  KeyResource,
  useAddKeyResourceMutation,
  useEditKeyResourceMutation,
  useRemoveKeyResourceMutation,
} from "@/graphql/Projects/key_resources";

import * as Icons from "@tabler/icons-react";
import * as Projects from "@/graphql/Projects";
import * as Forms from "@/components/Form";
import * as Popover from "@/components/Popover";

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

      <Body project={project} refetch={refetch} editable={editable} />
    </div>
  );
}

function Body({ project, refetch, editable }: Props): JSX.Element {
  if (project.keyResources.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {project.keyResources.map((kr) => (
        <Link resource={kr} key={kr.id} refetch={refetch} editable={editable} />
      ))}
    </div>
  );
}

function EmptyState() {
  return <div className="text-white-2">No key resources.</div>;
}

function Link({ resource, refetch, editable }: { resource: KeyResource; refetch: () => void; editable: boolean }) {
  return (
    <div className="font-medium bg-shade-1 pl-3 pr-2 py-2 flex items-center gap-2 rounded-lg cursor-pointer text-sm">
      <a href={resource.link} target="_blank" className="flex items-center gap-2">
        <LinkIcon type={resource.type} />
        {resource.title}
      </a>

      {editable && <LinkOptions resource={resource} refetch={refetch} />}
    </div>
  );
}

function LinkOptions({ resource, refetch }: { resource: KeyResource; refetch: () => void }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div className="text-white-2 hover:text-white-1" data-test-id="key-resource-options">
          <Icons.IconDotsVertical size={16} />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-none">
          <div className="p-1 bg-dark-3 rounded-lg shadow-lg border border-dark-5 text-sm">
            <EditResource resource={resource} refetch={refetch} />
            <RemoveResource resource={resource} refetch={refetch} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function RemoveResource({ resource, refetch }) {
  const [remove] = useRemoveKeyResourceMutation({
    onCompleted: () => {
      refetch();
    },
  });

  const handleRemove = async () => {
    await remove({
      variables: {
        id: resource.id,
      },
    });
  };

  return (
    <div
      className="flex gap-1 items-center rounded px-1.5 py-0.5 hover:bg-white-1/[3%] cursor-pointer hover:text-red-400"
      onClick={handleRemove}
      data-test-id="remove-key-resource"
    >
      <Icons.IconTrash size={16} className="text-red-400/70" />
      Remove
    </div>
  );
}

function EditResource({ resource, refetch }) {
  const [isModalOpen, setIsModalOpen]: [boolean, any] = React.useState(false);

  const openModal = () => setIsModalOpen(true);
  const hideModal = () => setIsModalOpen(false);

  const [title, setTitle] = React.useState(resource.title);
  const [link, setLink] = React.useState(resource.link);

  const [edit, { loading }] = useEditKeyResourceMutation({
    onCompleted: () => {
      hideModal();
      setTitle("");
      setLink("");
      refetch();
    },
  });

  const handleSubmit = () => {
    edit({
      variables: {
        input: {
          id: resource.id,
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
        className="flex gap-1 items-center rounded px-1.5 py-0.5 hover:bg-white-1/[3%] cursor-pointer"
        onClick={openModal}
        data-test-id="remove-key-resource"
      >
        <Icons.IconPencil size={16} className="text-white-1" />
        Edit
      </div>

      <Modal title={"Edit Key Resource"} isOpen={isModalOpen} hideModal={hideModal} minHeight="200px">
        <KeyResourcesForm
          title={title}
          setTitle={setTitle}
          link={link}
          setLink={setLink}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </Modal>
    </>
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
        <KeyResourcesForm
          title={title}
          setTitle={setTitle}
          link={link}
          setLink={setLink}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </Modal>
    </>
  );
}

function KeyResourcesForm({ title, setTitle, link, setLink, onSubmit, loading, buttonLabel = "Add" }) {
  const valid = title.length > 0 && link.length > 0;

  return (
    <Forms.Form onSubmit={onSubmit} loading={loading} isValid={valid}>
      <Forms.TextInput value={title} onChange={setTitle} label="Title" placeholder="e.g. GitHub Repository" />
      <Forms.TextInput
        value={link}
        onChange={setLink}
        label="URL"
        placeholder="e.g. https://github.com/operately/operately"
      />

      <Forms.SubmitArea>
        <Forms.SubmitButton data-test-id="save-key-resource">{buttonLabel}</Forms.SubmitButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
