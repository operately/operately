import React from "react";

import { useNavigate } from "react-router-dom";
import RichContent from "@/components/RichContent";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/graphql/Projects";

import { Truncate, useIsClamped } from "@/components/Truncate";

const CondensedLineCount = 4;
const ExpandedLineCount = 100;

interface ContextDescriptor {
  me: any;
  project: Projects.Project;
  editable: boolean;
  editLink?: () => void;

  isClamped?: boolean;
  isCondensed?: boolean;
  toggleLines?: () => void;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export default function Description({ me, project }) {
  const navigate = useNavigate();
  const editLink = () => navigate("/projects/" + project.id + "/description/edit");

  const [lines, setLines] = React.useState(CondensedLineCount);
  const toggleLines = () => {
    return setLines((lines) => {
      return lines === CondensedLineCount ? ExpandedLineCount : CondensedLineCount;
    });
  };

  const ref = React.useRef<HTMLDivElement>(null);
  const isClamped = useIsClamped(ref);
  const editable = me.id === project.champion?.id;
  const isCondensed = isClamped && lines === CondensedLineCount;

  return (
    <Context.Provider value={{ me, project, editable, editLink, isClamped, isCondensed, toggleLines }}>
      <div className="flex flex-col gap-1 mb-8 border-y border-dark-5 py-4 relative">
        <div className="font-bold flex justify-between items-center">
          About
          <EditButton />
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
  const { editable, editLink } = React.useContext(Context) as ContextDescriptor;

  if (editable) {
    return (
      <ActionLink onClick={editLink} data-test-id="write-project-description">
        Write description...
      </ActionLink>
    );
  } else {
    return <span className="text-white-2">No description.</span>;
  }
}

function ToggleHeight() {
  const { isCondensed, toggleLines, isClamped } = React.useContext(Context) as ContextDescriptor;

  if (!isClamped) return null;

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

function EditButton() {
  const { editable, editLink } = React.useContext(Context) as ContextDescriptor;

  if (!editable) return null;

  return (
    <div className="cursor-pointer hover:text-white-1 transition-all text-white-2" onClick={editLink}>
      <Icons.IconEdit size={18} />
    </div>
  );
}

function ActionLink({ onClick, children, variant = "primary", ...rest }) {
  const variants = {
    primary: "text-blue-400/90 hover:text-blue-400",
    secondary: "text-white-1/80 hover:text-white",
  };

  return (
    <a
      className={
        variants[variant] +
        " " +
        "font-medium cursor-pointer underline underline-offset-2 inline-flex items-center gap-1"
      }
      onClick={onClick}
      {...rest}
    >
      {children}
    </a>
  );
}
