import * as Projects from "@/models/projects";
import * as React from "react";

import { Avatar, Link, SecondaryButton } from "turboui";

interface ProjectDiscussionsSectionProps {
  project: Projects.Project;
  discussions: Projects.Discussion[];
}

export function ProjectDiscussionsSection({ project, discussions }: ProjectDiscussionsSectionProps) {
  const addButton = (
    <SecondaryButton linkTo={"#"} testId="add-discussions-button" size="xs">
      Start discussion
    </SecondaryButton>
  );

  return (
    <div className="border-t border-stroke-base py-6">
      <div className="flex items-start gap-4">
        <div className="w-1/5">
          <div className="font-bold text-sm">Discussions</div>
        </div>

        <div className="w-4/5">
          <Content discussions={discussions} />
          {project.permissions!.canComment && <div className="mt-2 flex">{addButton}</div>}
        </div>
      </div>
    </div>
  );
}

function Content({ discussions }: { discussions: Projects.Discussion[] }) {
  if (!discussions || discussions.length === 0) {
    return <DiscussionsZeroState />;
  } else {
    return <DiscussionsList discussions={discussions} />;
  }
}

function DiscussionsZeroState() {
  return <div className="text-sm">Share updates, ask questions, or provide feedback.</div>;
}

function DiscussionsList({ discussions }: { discussions: Projects.Discussion[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {discussions!.map((discussion: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <Avatar person={discussion.author} size={20} />
          <Link to={`#`}>{discussion.title}</Link>
        </div>
      ))}
    </div>
  );
}
