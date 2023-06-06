import React from "react";

import PostUpdate from "./PostUpdate";
import StatusUpdate from "./StatusUpdate";

export default function StatusUpdates({ project }) {
  return (
    <div className="w-1/3 bg-shade-1 backdrop-blur rounded-lg border border-shade-3">
      <div className="">
        <div className="flex items-center border-b border-shade-3 justify-between px-4">
          <div className="font-bold py-4 flex items-center gap-2">
            Status Updates
          </div>

          <PostUpdate />
        </div>

        <div className="flex flex-col">
          <StatusUpdate
            person={project.owner}
            title="Status Update"
            message="We have completed the first milestone and we are on track to complete the project on time. Last week we reached out to people who have signed up via the newsletter. In total we had around 800 singups, from which around 550 responded to the survey."
            comments={3}
            time="Mar 24th"
          />
          <StatusUpdate
            person={project.owner}
            acknowledged
            title="Status Update"
            message="The project is going well and we are expecting the finish all the work on time"
            comments={0}
            time="Mar 17th"
          />
          <StatusUpdate
            person={project.owner}
            acknowledged
            title="Status Update"
            message="The outages are still happening and we are working on a fix. We will keep you updated."
            comments={10}
            time="Mar 10th"
          />
          <StatusUpdate
            person={project.owner}
            acknowledged
            title="Status Update"
            message="We are currently working on delivering the first milestone which is due next week."
            comments={0}
            time="Mar 2nd"
          />
          <StatusUpdate
            person={project.contributors[0].person}
            acknowledged
            title="Request for Project Review"
            message="I haven't heard any news about the project for a while. Can you please provide an update?"
            comments={1}
            time="Mar 1st"
          />
          <StatusUpdate
            person={project.owner}
            acknowledged
            title="Status Update"
            message="The project was bootstrapped and the team is working on the first milestone."
            comments={3}
            time="Dec 25th, 2022"
          />
        </div>
      </div>
    </div>
  );
}
