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
    <div className="flex flex-col gap-1 relative my-8">
      <div className="font-extrabold text-lg text-white-1 leading-none">Key Resources</div>
      <div className="text-white-2 max-w-xl">Links to documents, spreadsheets, design assets...</div>

      <Body project={project} refetch={refetch} editable={editable} />
    </div>
  );
}

function Body({ project, refetch, editable }: Props): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2 mt-4 items-center">
      {project.keyResources.length > 0 ? (
        <Links project={project} refetch={refetch} editable={editable} />
      ) : (
        <EmptyState />
      )}

      <div className="font-bold flex justify-between items-center">
        {editable && <AddResource project={project} refetch={refetch} />}
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="text-white-2">No key resources.</div>;
}

function Links({ project, refetch, editable }: Props): JSX.Element {
  return (
    <>
      {project.keyResources.map((kr) => (
        <Link resource={kr} key={kr.id} refetch={refetch} editable={editable} />
      ))}
    </>
  );
}

function Link({ resource, refetch, editable }: { resource: KeyResource; refetch: () => void; editable: boolean }) {
  const href = resource.link.startsWith("http") ? resource.link : `https://${resource.link}`;

  return (
    <div className="font-medium bg-shade-1 flex items-center rounded-lg cursor-pointer overflow-hidden">
      <a
        href={href}
        target="_blank"
        className="flex items-center gap-2 hover:bg-shade-1 pl-3 pr-2 py-2 transition-colors"
      >
        <div className="shrink-0">
          <LinkIcon resource={resource} />
        </div>

        <div style={{ maxWidth: "200px" }} className="truncate">
          {resource.title}
        </div>
      </a>

      {editable && <LinkOptions resource={resource} refetch={refetch} />}
    </div>
  );
}

function LinkOptions({ resource, refetch }: { resource: KeyResource; refetch: () => void }) {
  const [popoverOpen, changePopoverOpen] = React.useState(false);
  const [editModalOpen, changeEditModalOpen] = React.useState(false);

  const handleEdit = () => {
    changePopoverOpen(false);
    changeEditModalOpen(true);
  };

  return (
    <Popover.Root open={popoverOpen} onOpenChange={changePopoverOpen}>
      <Popover.Trigger asChild>
        <div className="text-white-2 hover:bg-shade-1 pr-1 pl-1 py-2.5" data-test-id="key-resource-options">
          <Icons.IconDotsVertical size={20} strokeWidth={1.5} />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-none">
          <div className="p-1 bg-dark-3 rounded-lg shadow-lg border border-dark-5 text-sm">
            <EditResourceLinkOption onClick={handleEdit} />
            <RemoveResource resource={resource} refetch={refetch} />
          </div>
        </Popover.Content>
      </Popover.Portal>

      <EditResourceModal
        resource={resource}
        refetch={refetch}
        isOpen={editModalOpen}
        close={() => changeEditModalOpen(false)}
      />
    </Popover.Root>
  );
}

function EditResourceLinkOption({ onClick }) {
  return (
    <div
      className="flex gap-1.5 items-center rounded px-1.5 py-0.5 hover:bg-white-1/[3%] cursor-pointer"
      onClick={onClick}
      data-test-id="edit-key-resource"
    >
      <Icons.IconPencil size={24} className="text-white-1" />
      Edit
    </div>
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
      className="flex gap-1.5 items-center rounded px-1.5 py-0.5 hover:bg-white-1/[3%] cursor-pointer hover:text-red-400"
      onClick={handleRemove}
      data-test-id="remove-key-resource"
    >
      <Icons.IconTrash size={16} className="text-red-400/70" />
      Remove
    </div>
  );
}

function EditResourceModal({ resource, refetch, isOpen, close }) {
  const [title, setTitle] = React.useState(resource.title);
  const [link, setLink] = React.useState(resource.link);

  const [edit, { loading }] = useEditKeyResourceMutation({
    onCompleted: () => {
      setTitle("");
      setLink("");
      refetch();
      close();
    },
  });

  const handleSubmit = () => {
    edit({
      variables: {
        input: {
          id: resource.id,
          title,
          link,
        },
      },
    });
  };

  return (
    <>
      <Modal title={"Edit Key Resource"} isOpen={isOpen} hideModal={close} minHeight="200px">
        <KeyResourcesForm
          title={title}
          setTitle={setTitle}
          link={link}
          setLink={setLink}
          onSubmit={handleSubmit}
          loading={loading}
          buttonLabel="Save"
        />
      </Modal>
    </>
  );
}

const GithubLinkRegex = new RegExp("^https://github.com/.*/.*$");
const FigmaLinkRegex = new RegExp("^https://(.*).figma.com/.*$");
const SlackLinkRegex = new RegExp("^https://.*.slack.com/.*$");
const GoogleSheetLinkRegex = new RegExp("^https://docs.google.com/spreadsheets/d/.*$");

function LinkIcon({ resource }: { resource: KeyResource }) {
  if (resource.link.match(GithubLinkRegex)) {
    return <Icons.IconBrandGithub size={20} className="text-pink-400" />;
  }

  if (resource.link.match(FigmaLinkRegex)) {
    return <Icons.IconBrandFigma size={20} className="text-pink-400" />;
  }

  if (resource.link.match(SlackLinkRegex)) {
    return <Icons.IconBrandSlack size={20} className="text-pink-400" />;
  }

  if (resource.link.match(GoogleSheetLinkRegex)) {
    return <Icons.IconFileSpreadsheet size={20} className="text-pink-400" />;
  }

  return <Icons.IconLink size={20} className="text-pink-400" />;
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
        },
      },
    });
  };

  return (
    <>
      <div
        className="text-white-2 hover:text-white-1 cursor-pointer bg-shade-1 rounded-lg p-2"
        onClick={openModal}
        data-test-id="add-key-resource"
      >
        <Icons.IconPlus size={24} strokeWidth={1.5} />
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
    <div className="mt-8">
      <Forms.Form onSubmit={onSubmit} loading={loading} isValid={valid}>
        <Forms.TextInput
          value={title}
          onChange={setTitle}
          label="Title"
          placeholder="Give a title for this resource"
          autoFocus
        />

        <Forms.TextInput
          value={link}
          onChange={setLink}
          label="URL"
          placeholder="Link to your resource (ex. Google Doc, Figma Link)"
        />

        <Forms.SubmitArea>
          <Forms.SubmitButton data-test-id="save-key-resource">{buttonLabel}</Forms.SubmitButton>
        </Forms.SubmitArea>
      </Forms.Form>
    </div>
  );
}
