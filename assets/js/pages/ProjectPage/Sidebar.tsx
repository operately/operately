import React from "react";

import classnames from "classnames";

import { useNavigate } from "react-router-dom";

import * as Icons from "@tabler/icons-react";

export default function Sidebar({ project, isOpen, setOpen }) {
  const navigate = useNavigate();
  const gotoNewStatusUpdate = () => navigate(`/projects/${project.id}/updates/new?messageType=status_update`);
  const gotoContributorsPage = () => navigate(`/projects/${project.id}/contributors`);

  const tasks = [
    {
      title: "Write a project description",
      completed: project.description !== null,
    },
    {
      title: "Set the start and due dates",
      completed: project.staredAt !== null && project.deadline !== null,
    },
    {
      title: "Invite team members and assign roles",
      completed: project.contributors.length > 1,
    },
    {
      title: "Define the project milestones",
      completed: project.milestones.length > 0,
    },
    {
      title: "Write a status update",
      completed: project.updates.length > 0,
    },
  ];

  return (
    <div className="px-4 pt-16 relative">
      <SidebarToggle open={isOpen} setOpen={setOpen} />

      <h1 className="font-bold mb-4 text-xl">Champion's Toolbar</h1>
      <p className="text-sm">
        You are the champion of this project, responsible for leading the execution, setting up the team and their
        roles, and providing regular status updates about the progress.
      </p>

      <div>
        <h1 className="font-bold mb-4 mt-8">Your Tasks</h1>

        <div className="flex flex-col gap-2">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={classnames("border rounded-full w-6 h-6 flex items-center justify-center text-xs", {
                  "border-green-400/70 text-green-400": task.completed,
                  "border-white-2 text-white-1": !task.completed,
                })}
              >
                {task.completed ? <Icons.IconCheck size={14} /> : index + 1}
              </div>

              <span>{task.title}</span>
            </div>
          ))}
        </div>

        <h1 className="font-bold mb-4 mt-8">Actions</h1>

        <div className="flex flex-col gap-1">
          <div
            className="bg-white-1/[3%] rounded py-2 px-4 hover:bg-shade-1 hover:shadow flex items-center gap-2 text-white-1/80 hover:text-white-1 cursor-pointer"
            onClick={gotoNewStatusUpdate}
            data-test-id="add-status-update"
          >
            <Icons.IconReport size={16} />
            <span className="font-medium">Write a status update</span>
          </div>

          <div
            className="bg-white-1/[3%] rounded py-2 px-4 hover:bg-shade-1 hover:shadow flex items-center gap-2 text-white-1/80 hover:text-white-1 cursor-pointer"
            onClick={gotoContributorsPage}
          >
            <Icons.IconUsers size={16} />
            <span className="font-medium">Manage People</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarToggle({ open, setOpen }) {
  if (open) {
    return (
      <button
        className="absolute top-16 -left-10 p-2 rounded bg-white-1/5 hover:bg-white-1/20 transition-colors duration-200"
        onClick={() => setOpen(false)}
      >
        <Icons.IconChevronRight size={16} />
      </button>
    );
  } else {
    return (
      <button
        className="absolute top-16 p-2 rounded bg-white-1/10 hover:bg-white-1/20 transition-colors duration-200 flex items-center gap-2"
        style={{
          left: "-190px",
        }}
        onClick={() => setOpen(true)}
      >
        <Icons.IconArrowBarLeft size={16} />
        <span className="text-sm font-medium">Champion's Toolbar</span>
      </button>
    );
  }
}
