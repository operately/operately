import React from "react";

import { useNavigate } from "react-router-dom";
import RichContent from "@/components/RichContent";

import Truncate from "@/components/Truncate";

export default function Description({ me, project }) {
  const navigate = useNavigate();

  const [lines, setLines] = React.useState(3);

  const toggleLines = () => {
    if (lines === 3) {
      setLines(100);
    } else {
      setLines(3);
    }
  };

  if (project.description) {
    return (
      <div className="flex flex-col gap-1 mb-8">
        <div className="text-xl font-medium">
          <Truncate lines={lines}>
            <RichContent jsonContent={project.description} />
          </Truncate>
        </div>

        <div className="flex items-center gap-2">
          <ActionLink variant="secondary" onClick={() => navigate("/projects/" + project.id + "/description/edit")}>
            Edit
          </ActionLink>

          <ActionLink variant="secondary" onClick={toggleLines}>
            {lines === 3 ? "Show Full" : "Collapse"}
          </ActionLink>
        </div>
      </div>
    );
  } else {
    return (
      <div className="mb-4">
        <div className="font-bold">Description</div>

        <WriteDescription me={me} project={project} />
      </div>
    );
  }
}

function WriteDescription({ me, project }) {
  let navigate = useNavigate();

  if (project.champion.id !== me.id) {
    return <div className="text-white-2">No description.</div>;
  }

  return (
    <ActionLink onClick={() => navigate("/projects/" + project.id + "/description/edit")}>
      Write description...
    </ActionLink>
  );
}

function ActionLink({ onClick, children, variant = "primary" }) {
  const variants = {
    primary: "text-blue-400/80 hover:text-blue-400",
    secondary: "text-white-1/80 hover:text-white",
  };

  return (
    <a
      className={
        variants[variant] + " " + "font-medium cursor-pointer underline underline-offset-2 flex items-center gap-1"
      }
      onClick={onClick}
    >
      {children}
    </a>
  );
}
