import React from "react";

import { useBoolState } from "@/utils/useBoolState";

import RichContent from "@/components/RichContent";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/graphql/Projects";
import * as TipTapEditor from "@/components/Editor";

import { Truncate, useIsClamped } from "@/components/Truncate";
import Button from "@/components/Button";

const CondensedLineCount = 4;
const ExpandedLineCount = 100;

interface ContextDescriptor {
  me: any;
  project: Projects.Project;
  editable: boolean;
  editLink?: () => void;
  lines: number;

  isClamped?: boolean;
  isCondensed?: boolean;
  toggleLines?: () => void;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export default function Description({ me, project, refetch }) {
  const [editing, _, activateEdit, deactivateEdit] = useBoolState(false);

  return editing ? (
    <Editor project={project} refetch={refetch} deactivateEdit={deactivateEdit} />
  ) : (
    <Display project={project} activateEdit={activateEdit} me={me} />
  );
}

function Editor({ project, refetch, deactivateEdit }) {
  const [post, { loading }] = Projects.useUpdateDescriptionMutation({
    onCompleted: () => refetch(),
  });

  const submit = async () => {
    if (!editor) return;

    const content = editor.getJSON();

    await post({
      variables: { projectId: project.id, description: JSON.stringify(content) },
    });

    deactivateEdit();
  };

  const editor = TipTapEditor.useEditor({
    placeholder: "Write here...",
    content: JSON.parse(project.description),
  });

  return (
    <TipTapEditor.Root>
      <div className="border rounded-t-lg border-dark-8 p-4 bg-dark-2 z-20 relative -mt-4 -mx-4">
        <div className="text-white-1 mb-4" style={{ minHeight: "200px" }}>
          <TipTapEditor.EditorContent editor={editor} />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button onClick={submit} variant="success" loading={loading}>
              Save
            </Button>
            <Button variant="secondary" onClick={deactivateEdit}>
              Cancel
            </Button>
          </div>

          <TipTapEditor.Toolbar editor={editor} variant="small" />
        </div>

        <TipTapEditor.LinkEditForm editor={editor} />
      </div>
    </TipTapEditor.Root>
  );
}

function Display({ me, project, activateEdit }) {
  const editable = me.id === project.champion?.id;

  const [lines, setLines] = React.useState(CondensedLineCount);

  const toggleLines = () => {
    return setLines((lines) => {
      return lines === CondensedLineCount ? ExpandedLineCount : CondensedLineCount;
    });
  };

  const ref = React.useRef<HTMLDivElement>(null);
  const isClamped = useIsClamped(ref);
  const isCondensed = isClamped && lines === CondensedLineCount;

  return (
    <Context.Provider value={{ me, project, editable, isClamped, isCondensed, toggleLines, lines }}>
      <div className="flex flex-col gap-1 pb-4 relative border-b border-shade-1">
        <div className="font-bold flex gap-2 items-center">
          About
          <EditButton onClick={activateEdit} />
        </div>
        <div className="font-medium">
          <Truncate lines={lines} ref={ref}>
            <Body project={project} />
          </Truncate>

          <ToggleHeight />
        </div>
      </div>
    </Context.Provider>
  );
}

function Body({ project }) {
  if (project.description) {
    return <RichContent jsonContent={project.description} />;
  } else {
    return <EmptyDesctipion />;
  }
}

function EmptyDesctipion() {
  return <span className="text-white-2">No description.</span>;
}

function ToggleHeight() {
  const { isCondensed, toggleLines, isClamped, lines } = React.useContext(Context) as ContextDescriptor;

  if (!isClamped && lines === CondensedLineCount) return null;

  return (
    <div className="flex justify-center mt-2 absolute left-0 right-0 -bottom-2 text-white-2">
      <div
        className="bg-dark-5 px-4 rounded-lg hover:px-6 transition-all cursor-pointer"
        onClick={toggleLines}
        data-test-id="expand-project-description"
      >
        {isCondensed ? <Icons.IconChevronDown size={16} /> : <Icons.IconChevronUp size={16} />}
      </div>
    </div>
  );
}

function EditButton({ onClick }) {
  const { editable } = React.useContext(Context) as ContextDescriptor;

  if (!editable) return null;

  return (
    <div
      className="cursor-pointer hover:text-white-1 transition-all text-white-2"
      onClick={onClick}
      data-test-id="edit-project-description"
    >
      <Icons.IconEdit size={18} />
    </div>
  );
}
