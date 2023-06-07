import React from "react";

import PostUpdate from "./PostUpdate";
import StatusUpdate from "./StatusUpdate";

import * as Icons from "tabler-icons-react";

export default function StatusUpdates({ project }) {
  return (
    <div className="px-16 rounded-b-[30px] pb-8">
      <div className="">
        <div className="flex items-center justify-between gap-4">
          <div className="font-bold py-4 flex items-center gap-2 uppercase">
            <Icons.Direction size={20} />
            Status Updates
          </div>

          <div className="border-b border-pink-400 flex-1"></div>

          <PostUpdate />
        </div>

        <div className="fadeIn">
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
