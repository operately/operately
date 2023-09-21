import React from "react";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as People from "@/graphql/People";
import * as Me from "@/graphql/Me";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Paper from "@/components/PaperContainer";
import FormattedTime from "@/components/FormattedTime";

import { useDocumentTitle } from "@/layouts/header";

interface LoaderResult {
  project: Projects.Project;
  milestone: Milestones.Milestone;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  let milestoneDate = await client.query({
    query: Milestones.GET_MILESTONE,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
    milestone: milestoneDate.data.milestone,
    me: meData.data.me,
  };
}

export function Page() {
  const [{ project, milestone, me }, refetch] = Paper.useLoadedData() as [LoaderResult, () => void];

  useDocumentTitle(`${milestone.title} - ${project.name}`);

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <div className="text-3xl font-bold leading-none">{milestone.title}</div>

        <DetailList>
          <DetailListItem title="Status" value={milestone.status === "pending" ? "Open" : "Completed"} />
          <DetailListItem title="Due Date" value={<FormattedTime time={milestone.deadlineAt} format="short-date" />} />

          {milestone.status === "done" && (
            <DetailListItem
              title="Completed"
              value={<FormattedTime time={milestone.completedAt} format="short-date" />}
            />
          )}
        </DetailList>

        <div className="border-y border-dark-5 my-4 py-2 min-h-[200px]">
          <span className="text-white-2">No description. Add extra details or attach a file.</span>
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function DetailList({ children }) {
  return <div className="flex flex-col gap-1 my-4">{children}</div>;
}

function DetailListItem({ title, value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="font-bold w-24">{title}:</div>

      <div className="font-medium">{value}</div>
    </div>
  );
}
