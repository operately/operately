import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";

import { ProgressBar, PieChart } from "@/components/charts";
import { calculateStatus } from "@/features/SpaceTools/utils";
import { splitByStatus } from "@/models/milestones";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { DivLink } from "@/components/Link";
import classNames from "classnames";

interface Space {
  name: string;
  id: string;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

interface LoaderResult {
  spaces: { [key: string]: Space };
  projects: Projects.Project[];
  goals: Goals.Goal[];
}

export async function loader(): Promise<LoaderResult> {
  const [goals, projects] = await Promise.all([
    Goals.getGoals({
      includeTargets: true,
      includeSpace: true,
      includeLastCheckIn: true,
      includeChampion: true,
      includeReviewer: true,
    }).then((data) => data.goals!),
    Projects.getProjects({
      includeGoal: true,
      includeSpace: true,
      includeLastCheckIn: true,
      includeChampion: true,
      includeMilestones: true,
      includePrivacy: true,
      includeReviewer: true,
      includeContributors: true,
      includeRetrospective: true,
    }).then((data) => data.projects!),
  ]);

  let spaces: { [key: string]: Space } = {};

  goals.forEach((goal) => {
    if (!spaces[goal.space!.id!]) {
      spaces[goal.space!.id!] = { id: goal.space!.id!, name: goal.space!.name!, goals: [], projects: [] };
    }

    spaces[goal.space!.id!]!.goals.push(goal);
  });

  projects.forEach((project) => {
    if (!spaces[project.space!.id!]) {
      spaces[project.space!.id!] = { id: project.space!.id!, name: project.space!.name!, goals: [], projects: [] };
    }

    spaces[project.space!.id!]!.projects.push(project);
  });

  return { spaces, projects, goals };
}

export function Page() {
  return (
    <Pages.Page title={"Radar"}>
      <Paper.Root size="xlarge">
        <div className="text-4xl font-extrabold text-center">Company Radar</div>
        <div className="mt-1 text-center mb-20">Get a bird's eye view of progress in the company</div>

        <div className="grid grid-cols-3 gap-8 mb-8">
          <YearSummary />
          <QuarterSummary />
          <MonthSummary />
        </div>

        <OverviewOfSpace />
      </Paper.Root>
    </Pages.Page>
  );
}

function YearSummary() {
  return (
    <div className="bg-surface-base p-2 rounded-lg border border-stroke-base">
      <div className="text-center font-semibold py-2 text-base">Year Summary</div>
      <div className="h-40 rounded"></div>
    </div>
  );
}

function QuarterSummary() {
  return (
    <div className="bg-surface-base p-2 rounded-lg border border-stroke-base">
      <div className="text-center font-semibold py-2 text-base">Quorter Summary</div>
      <div className="h-40 rounded"></div>
    </div>
  );
}

function MonthSummary() {
  return (
    <div className="bg-surface-base p-2 rounded-lg border border-stroke-base">
      <div className="text-center font-semibold py-2 text-base">Month Summary</div>
      <div className="h-40 rounded"></div>
    </div>
  );
}

function OverviewOfSpace() {
  const { spaces } = Pages.useLoadedData<LoaderResult>();

  return (
    <div className="p-2 bg-surface-base border border-stroke-base rounded-lg relative">
      <div className="text-center font-semibold py-4">Overview of spaces</div>

      <div className="bg-surface-dimmed rounded-lg">
        <div className="flex justify-between items-center mb-4 w-[300px] absolute top-6 left-6 right-0">
          <div className="bg-callout-error flex-1 p-3 text-callout-error-message border border-red-300 rounded">
            <Icons.IconAlertOctagon size={20} className="text-red-500" />
            <div className="font-bold text-sm mt-2">Product and Finance need attention</div>
            <div className="font-medium text-xs">More than 20% of goals are off track, or have no progress</div>
          </div>
        </div>

        <div className="p-8">
          <div className="">
            <div className="flex justify-center items-start flex-wrap gap-4">
              {Object.values(spaces)
                .filter((s) => s.name === "Company")
                .map((space) => (
                  <SpaceOverview key={space.id} space={space} />
                ))}
            </div>
          </div>

          <div className="h-6 border-l w-0.5 bg-surface-outline mx-auto" />
          <div className="border-t border-x border-surface-outline h-6 mx-[160px] rounded-t-full" />
          <div className="h-6 border-l w-0.5 bg-surface-outline mx-auto -mt-6" />

          <div className="">
            <div className="flex justify-center items-start flex-wrap gap-4">
              {Object.values(spaces)
                .filter((s) => s.name !== "Company")
                .map((space) => (
                  <SpaceOverview key={space.id} space={space} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContainerProps {
  children: React.ReactNode;
  path: string;
}

export function Container({ children, path }: ContainerProps) {
  const className = classNames(
    "text-xs",
    "w-full h-[380px] w-[340px] max-w-[340px] overflow-hidden",
    "bg-surface-base",
    "border border-surface-outline",
    "rounded-lg",
  );

  return <DivLink to={path} className={className} children={children} />;
}

export function SpaceOverview({ space }: { space: Space }) {
  const path = Paths.spaceGoalsPath(space.id!);

  const openGoals = space.goals!.filter((g) => !g.closedAt);
  const openProjects = space.projects!.filter((p) => p.status !== "closed" && p.status !== "paused");

  if (openGoals.length < 1 && openProjects.length < 1) return null;

  return (
    <Container path={path}>
      <div className="font-bold mt-2 grid grid-cols-3 gap-2 items-center mx-4 border-b border-stroke-base p-2">
        <div></div>
        <div className="font-bold text-center text-base">{space.name}</div>
        <div className="flex justify-end">
          {space.name === "Product" && <Icons.IconAlertOctagon size={20} className="text-red-500" />}
        </div>
      </div>

      <div className="m-2">
        <GoalList goals={openGoals} projectsCount={openProjects.length} />
        <ProjectList projects={openProjects} />
      </div>
    </Container>
  );
}

function GoalList({ goals, projectsCount }: { goals: Goals.Goal[]; projectsCount: number }) {
  if (goals.length < 1) return <></>;

  // Limiting the number of goals to ensure that the component
  // displays goals and projects evenly in the container.
  // With the current fixed 380px height, only 9 goals and project
  // can be displayed.
  const slicedGoals = React.useMemo(() => {
    if (projectsCount > 4) {
      return goals.slice(0, 5);
    }
    return goals.slice(0, 9 - projectsCount);
  }, []);

  return (
    <div className="flex flex-col px-2 py-3">
      <Header goals={goals} type="goals" />

      {slicedGoals.map((goal) => (
        <GoalItem goal={goal} key={goal.id} />
      ))}
    </div>
  );
}

function GoalItem({ goal }: { goal: Goals.Goal }) {
  assertPresent(goal.progressPercentage, "progressPercentage must be present in goal");

  const status = React.useMemo(() => {
    if (goal.isOutdated) return "outdated";
    if (!goal.lastCheckIn) return "on_track";
    return goal.lastCheckIn.status!;
  }, [goal.isOutdated, goal.lastCheckIn]);

  return (
    <div className="flex gap-2 items-center">
      <div className="border-l border-surface-outline ml-2 h-[20px]"></div>

      <div className="flex items-center justify-between gap-1 overflow-hidden flex-1 mr-2">
        {/* Extra div is necessary to ensure all bars have the same size */}
        <div className="truncate ml-1">{goal.name}</div>
        <div>
          <ProgressBar percentage={goal.progressPercentage} status={status} className="w-[50px] h-[9px]" />
        </div>
      </div>
    </div>
  );
}

function ProjectList({ projects }: { projects: Projects.Project[] }) {
  if (projects.length < 1) return <></>;

  return (
    <div className="flex flex-col px-2 py-3">
      <Header projects={projects} type="projects" />

      {projects.map((project) => (
        <ProjectItem project={project} key={project.id} />
      ))}
    </div>
  );
}

function ProjectItem({ project }: { project: Projects.Project }) {
  assertPresent(project.milestones, "milestones must be present in project");

  const total = project.milestones.length;
  const { done } = splitByStatus(project.milestones);

  const percentage = total === 0 ? 0 : (done.length / total) * 100;

  return (
    <div className="flex gap-2 items-center">
      <div className="border-l border-surface-outline ml-2 h-[20px]"></div>

      <div className="flex items-center justify-between gap-1 overflow-hidden flex-1 mr-2">
        <div className="truncate">{project.name}</div>
        <div>
          <ProgressBar percentage={percentage} status={project.status!} className="w-[50px] h-[9px]" />
        </div>
      </div>
    </div>
  );
}

interface GoalsHeader {
  goals: Goals.Goal[];
  type: "goals";
}
interface ProjectsHeader {
  projects: Projects.Project[];
  type: "projects";
}
interface ResourceStatus {
  on_track: number;
  caution: number;
  issue: number;
  pending: number;
  total: number;
}

function Header(props: GoalsHeader | ProjectsHeader) {
  const status: ResourceStatus = React.useMemo(() => {
    switch (props.type) {
      case "goals":
        return calculateStatus(props.goals);
      case "projects":
        return calculateStatus(props.projects);
    }
  }, []);

  return (
    <div className="font-bold flex items-center gap-2 text-sm mb-2">
      <PieChart
        total={status.total}
        slices={[
          { size: status.on_track, color: "green" },
          { size: status.caution, color: "yellow" },
          { size: status.issue, color: "red" },
          { size: status.pending, color: "gray" },
        ]}
      />
      {status.on_track}/{status.total} {props.type} on track
    </div>
  );
}
