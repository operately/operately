import React from "react";

import { useNavigate } from "react-router-dom";
import RichContent from "@/components/RichContent";
import * as Icons from "@tabler/icons-react";

import { Truncate, useIsClamped } from "@/components/Truncate";

const CondensedLineCount = 4;
const ExpandedLineCount = 100;
const isCondensed = (lines: number) => lines === CondensedLineCount;
const toggle = (lines: number) => (lines === CondensedLineCount ? ExpandedLineCount : CondensedLineCount);

export default function Description({ me, project }) {
  const navigate = useNavigate();
  const editLink = () => navigate("/projects/" + project.id + "/description/edit");

  const [lines, setLines] = React.useState(CondensedLineCount);
  const toggleLines = () => setLines(toggle);

  const ref = React.useRef<HTMLDivElement>(null);
  const isClamped = useIsClamped(ref);

  return (
    <div className="flex flex-col gap-1 mb-8 border-y border-dark-5 py-4 relative">
      <div className="font-bold flex justify-between items-center">
        About
        <EditButton me={me} project={project} onClick={editLink} />
      </div>

      <div className="font-medium">
        <Truncate lines={lines} ref={ref}>
          <Body project={project} me={me} editLink={editLink} />
        </Truncate>

        {isClamped && <ToggleHeight lines={lines} toggleLines={toggleLines} />}
      </div>
    </div>
  );
}

function Body({ project, me, editLink }) {
  if (project.description) {
    return <RichContent jsonContent={project.description} />;
  } else {
    return <EmptyDesctipion me={me} project={project} editLink={editLink} />;
  }
}

function EmptyDesctipion({ me, project, editLink }) {
  if (me.id === project.champion.id) {
    return <ActionLink onClick={editLink}>Write description...</ActionLink>;
  } else {
    return <span className="text-white-2">No description.</span>;
  }
}

function ToggleHeight({ lines, toggleLines }) {
  return (
    <div className="flex justify-center mt-2 absolute left-0 right-0 -bottom-2 text-white-2">
      <div className="bg-dark-5 px-4 rounded-lg hover:px-6 transition-all cursor-pointer" onClick={toggleLines}>
        {isCondensed(lines) ? <Icons.IconChevronDown size={16} /> : <Icons.IconChevronUp size={16} />}
      </div>
    </div>
  );
}

function EditButton({ me, project, onClick }) {
  if (me.id === project.champion.id) {
    return (
      <div className="cursor-pointer hover:text-white-1 transition-all text-white-2" onClick={onClick}>
        <Icons.IconEdit size={18} />
      </div>
    );
  } else {
    return null;
  }
}

function ActionLink({ onClick, children, variant = "primary" }) {
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
    >
      {children}
    </a>
  );
}
