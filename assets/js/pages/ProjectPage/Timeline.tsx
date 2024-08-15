import React from "react";

import * as Time from "@/utils/time";
import * as Projects from "@/models/projects";

import FormattedTime from "@/components/FormattedTime";
import Duration from "@/components/Duration";

import { DimmedLabel } from "./Label";
import { NextMilestone } from "./NextMilestone";

export default function Timeline({ project }) {
  return (
    <div>
      <div className="flex items-start gap-12 text-sm mb-6">
        <StartDate project={project} />
        <EndDate project={project} />
        <DurationField project={project} />
        <Progress project={project} />
      </div>

      {false ? <NextMilestone project={project} /> : "" }
      <MilestoneList />
    </div>
  );
}

function StartDate({ project }: { project: Projects.Project }) {
  return (
    <div>
      <DimmedLabel>Start Date</DimmedLabel>
      <div className="font-semibold">
        <FormattedTime time={project.startedAt!} format="short-date" />
      </div>
    </div>
  );
}

function EndDate({ project }: { project: Projects.Project }) {
  return (
    <div>
      <DimmedLabel>Due Date</DimmedLabel>
      {project.deadline ? (
        <div className="font-semibold">
          <FormattedTime time={project.deadline} format="short-date" />
        </div>
      ) : (
        <div>
          <span className="text-content-dimmed">No due date</span>
        </div>
      )}
    </div>
  );
}

function DurationField({ project }: { project: Projects.Project }) {
  const start = Time.parse(project.startedAt);
  const end = Time.parse(project.deadline);

  if (!start) return null;
  if (!end) return null;

  return (
    <div>
      <DimmedLabel>Duration</DimmedLabel>
      <div className="font-semibold">
        <Duration start={start} end={end} />
      </div>
    </div>
  );
}

function Progress({ project }: { project: Projects.Project }) {
  if (project.status === "closed") return null;
  if (project.isArchived) return null;

  const start = Time.parse(project.startedAt);
  const end = Time.parse(project.deadline);

  if (!start) return null;
  if (!end) return null;

  return (
    <div>
      <DimmedLabel>Progress</DimmedLabel>
      <div className="flex items-center gap-2 ">
        {Time.isPast(start) ? (
          <span className="font-semibold">
            {Time.weeksBetween(start, new Date())} / {Time.weeksBetween(start, end)} weeks
          </span>
        ) : (
          <>Not yet started</>
        )}
      </div>
    </div>
  );
}

function MilestoneList() {
  const milestones = [
    {
      id: 1,
      title: "Design Phase Completion",
      dueDate: "Aug 19",
      isOverdue: false,
      commentCount: 5,
      pendingTasks: 3,
      description: "Finalize all UI/UX designs and get stakeholder approval for the new dashboard layout."
    },
    {
      id: 2,
      title: "Backend API Development",
      dueDate: "Sep 5",
      isOverdue: true,
      commentCount: 8,
      pendingTasks: 12,
      description: "Complete the development of RESTful APIs for user authentication, data retrieval, and real-time updates."
    },
    {
      id: 3,
      title: "User Testing",
      dueDate: "Oct 1",
      isOverdue: false,
      commentCount: 2,
      pendingTasks: 7,
      description: ""
    }
  ];


  return (
    <div className="rounded-lg shadow-sm">
      <DimmedLabel><a href="" className="underline underline-offset-2 hover:text-link-hover">Upcoming Milestones</a> (4)</DimmedLabel>
      <ul role="list" className="divide-y divide-gray-200">
        {milestones.map((milestone, index) => (
          <li key={milestone.id} className={`py-4 pr-4 sm:pr-6 ${index === 0 ? 'rounded-t-lg' : ''} ${index === milestones.length - 1 ? 'rounded-b-lg' : ''} hover:bg-white transition duration-150 ease-in-out`}>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className={`${milestone.isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
                  </svg>
                </span>
                <a href="#" className="text-sm font-medium text-blue-600 hover:underline underline-offset-2 decoration-blue-300">{milestone.title}</a>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 pl-8">
                <div className="flex space-x-4">
                  <span>Due {milestone.dueDate}</span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    {milestone.commentCount}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                    </svg>
                    {milestone.pendingTasks} pending tasks
                  </span>
                </div>
              </div>
              {milestone.description && (
                <p className="text-sm text-gray-600 line-clamp-2 pl-8">{milestone.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}