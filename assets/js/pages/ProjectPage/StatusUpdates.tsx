import React from "react";

import * as Icons from "tabler-icons-react";
import StatusUpdate from "./StatusUpdate";
import { Link } from "react-router-dom";
import RichContent from "@/components/RichContent";

import * as ProjectQueries from "@/graphql/Projects";

interface StatusUpdatesProps {
  project: ProjectQueries.Project;
}

export default function StatusUpdates({
  project,
}: StatusUpdatesProps): JSX.Element {
  return (
    <div className="px-16 rounded-b-[30px] pb-8">
      <div className="">
        <div className="flex items-center justify-between gap-4">
          <SectionTitle title="Status Updates" />
          <SeparatorLine />
          <PostUpdateButton link_to={`/projects/${project.id}/new_update`} />
        </div>

        <div className="fadeIn">
          {project.activities.map((activity) => (
            <StatusUpdate
              person={activity.author}
              title="Status Update"
              message={<RichContent jsonContent={activity.message} />}
              comments={3}
              time={activity.insertedAt}
            />
          ))}

          <StatusUpdate
            person={project.owner}
            title="Status Update"
            message="We have completed the first milestone and we are on track to complete the project on time. Last week we reached out to people who have signed up via the newsletter. In total we had around 800 singups, from which around 550 responded to the survey."
            comments={3}
            time={Date.parse("2023-05-23")}
          />
          <StatusUpdate
            person={project.owner}
            acknowledged
            title="Status Update"
            message="The project is going well and we are expecting the finish all the work on time"
            comments={0}
            time={Date.parse("2023-05-17")}
          />
          <StatusUpdate
            person={project.owner}
            acknowledged
            title="Status Update"
            message="The outages are still happening and we are working on a fix. We will keep you updated."
            comments={10}
            time={Date.parse("2023-03-10")}
          />
          <StatusUpdate
            person={project.owner}
            acknowledged
            title="Status Update"
            message="We are currently working on delivering the first milestone which is due next week."
            comments={0}
            time={Date.parse("2023-03-02")}
          />
          <StatusUpdate
            person={project.contributors[0].person}
            acknowledged
            title="Request for Project Review"
            message="I haven't heard any news about the project for a while. Can you please provide an update?"
            comments={1}
            time={Date.parse("2023-03-01")}
          />
          <StatusUpdate
            person={project.owner}
            acknowledged
            title="Status Update"
            message="The project was bootstrapped and the team is working on the first milestone."
            comments={3}
            time={Date.parse("2022-12-25")}
          />
        </div>
      </div>
    </div>
  );
}

function PostUpdateButton({ link_to }) {
  return (
    <Link
      to={link_to}
      className="text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:border-white-2 text-white-1 hover:text-white-1 px-3 py-1.5 text-sm flex items-center gap-2"
    >
      <Icons.Message2 size={20} />
      Post Update
    </Link>
  );
}

function SeparatorLine() {
  return <div className="border-b border-white-2 flex-1"></div>;
}

function SectionTitle({ title }) {
  return (
    <div className="font-bold py-4 flex items-center gap-2 uppercase">
      {title}
    </div>
  );
}
