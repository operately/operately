import React from "react";

import { GhostButton, FilledButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { Link } from "@/components/Link";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";
import * as Router from "react-router-dom";
import { createPath } from "@/utils/paths";
import { useLoadedData } from "./loader";
import Avatar from "@/components/Avatar";
import classNames from "classnames";
import FormattedTime from "@/components/FormattedTime";

export function Page() {
  const { group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large" fluid>
        <Paper.Body minHeight="500px">
          <GroupPageNavigation group={group} activeTab="goals" />
          <Content />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Content() {
  const { group, goals } = useLoadedData();
  const newGoalPath = createPath("spaces", group.id, "goals", "new");

  return (
    <>
      <div className="flex items-center justify-between mb-12">
        <div className="font-extrabold text-3xl">Goals</div>
        <FilledButton type="primary" size="sm" linkTo={newGoalPath} testId="add-goal">
          Add Goal
        </FilledButton>
      </div>

      <GoalList goals={goals} />
    </>
  );
}

function GoalList({ goals }: { goals: Goals.Goal[] }) {
  return (
    <div className="flex flex-col gap-12">
      {goals
        .filter((goal) => !goal.isArchived)
        .map((goal) => {
          return <GoalItem goal={goal} key={goal.id} />;
        })}
    </div>
  );
}

function GoalItem({ goal }: { goal: Goals.Goal }) {
  const path = createPath("goals", goal.id);
  const projects = (goal.projects || []).map((p) => p!);

  return (
    <div className="flex justify-between">
      <div className="flex items-start gap-4 flex-1">
        <Avatar key={goal!.champion.id} person={goal!.champion} size={40} />

        <div className="flex-1">
          <div className="flex justify-between items-center">
            <div className="font-bold">
              <Link to={path}>{goal.name}</Link>
            </div>

            <div className="h-px bg-stroke-base flex-1 mx-4" />

            <div className="bg-green-100 text-green-800 rounded px-1.5 py-0.5 font-semibold text-sm text-right">
              78%
            </div>
          </div>

          <ProjectList projects={projects} />
        </div>
      </div>
    </div>
  );
}

function ProjectList({ projects }: { projects: Projects.Project[] }) {
  return (
    <div className="flex flex-col gap-2 my-2">
      {projects.map((project) => {
        return <ProjectListItem project={project} key={project.id} />;
      })}

      <div className="flex items-center gap-2">
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

function ProjectListItem({ project }: { project: Projects.Project }) {
  return (
    <div className="flex justify-between items-center flex-1">
      <div className="flex gap-2 font-medium items-center">
        <SoftLink to={`/projects/${project.id}`}>{project.name}</SoftLink>

        <div className="bg-green-100 text-green-800 rounded-full px-1.5 py-0.5 text-xs font-semibold">On Track</div>

        {project.deadline && (
          <div className="bg-surface-dimmed rounded-full px-1.5 py-0.5 text-xs font-semibold flex items-center gap-1 text-content-dimmed">
            <Icons.IconCalendar size={16} />
            Due <FormattedTime time={project.deadline} format="short-date" />
          </div>
        )}

        <div className="flex items-center -space-x-1">
          {project.contributors!.map((contributor) => (
            <div className="rounded-full bg-white-1 p-px" key={contributor!.person.id}>
              <Avatar key={contributor!.person.id} person={contributor!.person} size={16} />
            </div>
          ))}
        </div>
      </div>

      <div className="h-px border-t border-stroke-base border-dotted flex-1 mx-4" />

      <div className="bg-green-100 text-green-800 rounded px-1.5 py-0.5 font-semibold text-sm text-right">30%</div>
    </div>
  );
}
