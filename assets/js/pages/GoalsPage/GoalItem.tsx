import * as React from "react";

import { GhostButton, FilledButton } from "@/components/Button";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";
import * as Router from "react-router-dom";

import Avatar from "@/components/Avatar";
import classNames from "classnames";
import FormattedTime from "@/components/FormattedTime";

export function GoalItem({ form, goal }: { goal: Goals.Goal; form: FormState }) {
  console.log("GoalItem", goal);
  const projects = (goal.projects || []).map((p) => p!);

  return (
    <div>
      <div className="mt-6" />
      <MetricList targets={goal.targets} form={form} />
      <div className="mt-8" />
      <ProjectList projects={projects} form={form} />
    </div>
  );
}

function MetricList({ targets, form }: { targets: Goals.Target[]; form: FormState }) {
  return (
    <div className="flex flex-col gap-2 my-2">
      <div className="uppercase text-xs font-medium text-slate-800 tracking-wide">Success Conditions</div>
      {targets.map((target) => {
        return <MetricListItem target={target} key={target.id} form={form} />;
      })}

      <div className="flex items-center gap-2 mt-2">
        <GhostButton size="sm" linkTo="/new-project" type="secondary">
          Add Condition
        </GhostButton>
      </div>
    </div>
  );
}

function MetricStatus({ target }: { target: Goals.Target }) {
  const baseClass = "text-center rounded px-1.5 py-0.5 font-semibold text-xs w-[4.5rem] relative bg-gray-500 shrink-0";

  let className = baseClass + " text-white-1";

  let title = (
    <span className="relative z-10">
      {target.value} of {target.to}
    </span>
  );

  const width = (target.value / target.to) * 100;

  let meter = (
    <div className="insert-0 rounded absolute top-0 left-0 w-full h-full bg-accent-1" style={{ width: width + "%" }} />
  );

  return (
    <div className={className}>
      {title} {meter}
    </div>
  );
}

function MetricListItem({ target, form }: { target: Goals.Target; form: FormState }) {
  return (
    <div>
      <div className="flex gap-2 font-medium items-center">
        <MetricStatus target={target} />
        <div className="font-medium truncate">{target.name}</div>

        <div className="h-px border-t border-stroke-base border-dotted flex-1 mx-4 min-w-[50px]" />

        <div className="bg-surface-dimmed rounded-full px-1.5 py-0.5 text-xs font-semibold flex items-center gap-1 text-content-dimmed shrink-0">
          <Icons.IconCalendar size={16} />
          Updated <FormattedTime time={new Date()} format="relative-day" />
        </div>
      </div>
    </div>
  );
}

function ProjectList({ projects, form }: { projects: Projects.Project[]; form: FormState }) {
  return (
    <div className="flex flex-col gap-2 my-2">
      <div className="uppercase text-xs font-medium text-slate-800 tracking-wide">Projects</div>
      {projects.map((project) => {
        return <ProjectListItem project={project} key={project.id} form={form} />;
      })}

      <div className="flex items-center gap-2 mt-2">
        <GhostButton size="sm" linkTo="/new-project" type="secondary">
          Add Project
        </GhostButton>
      </div>
    </div>
  );
}

export function SoftLink({ to, children, target }: { to: string; children: React.ReactNode; target?: string }) {
  const className = classNames("text-content-base hover:underline underline-offset-2 cursor-pointer transition-colors");

  return (
    <Router.Link to={to} className={className} target={target}>
      {children}
    </Router.Link>
  );
}

function ProjectStatus({ project }: { project: Projects.Project }) {
  const baseClass = "text-center rounded px-1.5 py-1 font-semibold text-xs w-[4.5rem]";

  let className = baseClass + " ";
  let title = "On Track";

  switch (project.lastCheckIn?.status) {
    case "on-track":
      className += "bg-accent-1 text-white-1";
      title = "On Track";
      break;

    case "caution":
      className += "bg-yellow-300";
      title = "Caution";
      break;

    case "issue":
      className += "bg-red-500 text-white-1";
      title = "Issue";
      break;

    default:
      className += "bg-accent-1 text-white-1";
      title = "On Track";
  }

  return <div className={className}>{title}</div>;
}

function ProjectListItem({ project, form }: { project: Projects.Project; form: FormState }) {
  return (
    <div>
      <div className="flex justify-between items-center flex-1 gap-2">
        <div className="flex gap-2 font-medium items-center">
          <ProjectStatus project={project} />

          <div className="font-medium flex items-center gap-1">
            <SoftLink to={`/projects/${project.id}`}>{project.name}</SoftLink>
          </div>

          <div className="flex items-center -space-x-1">
            {project.contributors!.map((contributor) => (
              <div className="rounded-full bg-white-1 p-px" key={contributor!.person.id}>
                <Avatar key={contributor!.person.id} person={contributor!.person} size={16} />
              </div>
            ))}
          </div>
        </div>

        <div className="h-px border-t border-stroke-base border-dotted flex-1 mx-4" />

        {project.deadline && (
          <div className="bg-surface-dimmed rounded-full px-1.5 py-0.5 text-xs font-semibold flex items-center gap-1 text-content-dimmed">
            <Icons.IconCalendar size={16} />
            Due <FormattedTime time={project.deadline} format="short-date" />
          </div>
        )}
      </div>

      {form.showMilestones && project.milestones?.length > 0 && (
        <MilestoneList project={project} milestones={project.milestones!} />
      )}
    </div>
  );
}

function MilestoneList({ project, milestones }: { milestones: Projects.Milestone[] }) {
  return (
    <div className="flex flex-col mt-2 ml-[5rem] gap-2">
      {milestones.map((milestone) => {
        return <MilestoneListItem milestone={milestone} key={milestone.id} project={project} />;
      })}
    </div>
  );
}

function MilestoneListItem({ project, milestone }: { milestone: Projects.Milestone; project: Projects.Project }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <div className="flex gap-1 items-center">
        <div className="font-medium flex items-center gap-1">
          <Icons.IconFlag3Filled size={14} />
          <SoftLink to={`/projects/${project.id}/milestones/${milestone.id}`}>{milestone.title}</SoftLink>
        </div>
      </div>

      <div className="h-px border-t border-stroke-base border-dotted flex-1 mx-4" />

      {milestone.deadlineAt && (
        <div className="bg-surface-dimmed rounded-full px-1.5 py-0.5 text-xs font-semibold flex items-center gap-1 text-content-dimmed">
          <Icons.IconCalendar size={16} />
          Due <FormattedTime time={milestone.deadlineAt} format="short-date" />
        </div>
      )}
    </div>
  );
}
