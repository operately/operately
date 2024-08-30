import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

import { GoalTree } from "@/features/goals/GoalTree";
import { Feed, useItemsQuery } from "@/features/Feed";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { LastCheckInMessage } from "@/features/goals/GoalCheckIn";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { Paths } from "@/routes/paths";
import { BlackLink } from "@/components/Link";
import { IconListTree, IconMessage } from "@tabler/icons-react";
import { Subheader } from "@/components/Text";
import { GhostButton } from "@/components/Buttons";

interface LoaderResult {
  goal: Goals.Goal;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const goalPromise = await Goals.getGoal({
    id: params.id,
    includeSpace: true,
    includeChampion: true,
    includeReviewer: true,
    includeTargets: true,
    includeProjects: true,
    includeLastCheckIn: true,
    includePermissions: true,
  }).then((data) => data.goal!);

  const goalsPromise = Goals.getGoals({
    includeTargets: true,
    includeSpace: true,
    includeLastCheckIn: true,
    includeChampion: true,
    includeReviewer: true,
  }).then((data) => data.goals!);

  const projectsPromise = Projects.getProjects({
    includeGoal: true,
    includeSpace: true,
    includeLastCheckIn: true,
    includeChampion: true,
    includeMilestones: true,
    includePrivacy: true,
  }).then((data) => data.projects!);

  return {
    goal: await goalPromise,
    goals: await goalsPromise,
    projects: await projectsPromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function Page() {
  const { goal, goals, projects } = useLoadedData();

  assertPresent(goal.notifications, "Goal notifications must be defined");
  useClearNotificationsOnLoad(goal.notifications);

  return (
    <Pages.Page title={[goal.name!]} testId="goal-page">
      <Paper.Root size="large">
        <Navigation space={goal.space!} />

        <Paper.Body minHeight="none">
          <Header goal={goal} />

          {/*
          <LastCheckInMessage goal={goal} />

          <MessageBoard goal={goal} />

          <GoalSubGoals goal={goal} goals={goals} projects={projects} />

          <GoalFeed /> */}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function MessageBoard({ goal }) {
  return (
    <div className="divide-y divide-surface-outline mt-12">
      <div className="px-2 py-5">
        <div className="flex justify-between">
          <div className="flex items-center gap-1 font-medium text-lg text-content-base">
            <IconMessage size={20} /> <BlackLink to={Paths.goalDiscussionsPath(goal.id!)}>Message board</BlackLink> (5)
          </div>
          <GhostButton type="secondary" size="xs">
            Write a new message
          </GhostButton>
        </div>
      </div>
      <div className="px-2 py-2">
        <Discussions />
        <div className="my-2">
          <BlackLink to={Paths.goalDiscussionsPath(goal.id!)}>View all discussions</BlackLink>
        </div>
      </div>
    </div>
  );
}

function CircleWithNumber({ totalComments }) {
  return (
    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
      <span className="text-white-1 text-xs font-bold">{totalComments}</span>
    </div>
  );
}

const discussions = [
  {
    id: 1,
    title: "Atque perspiciatis et et aut ut porro voluptatem blanditiis?",
    href: "#",
    author: { name: "Leslie A.", href: "#" },
    date: "2d ago",
    dateTime: "2023-01-23T22:34Z",
    status: "active",
    totalComments: 24,
    commenters: [
      {
        id: 12,
        name: "Emma Dorsey",
        imageUrl:
          "https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      {
        id: 6,
        name: "Tom Cook",
        imageUrl:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      {
        id: 4,
        name: "Lindsay Walton",
        imageUrl:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      {
        id: 16,
        name: "Benjamin Russel",
        imageUrl:
          "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      {
        id: 23,
        name: "Hector Gibbons",
        imageUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
    ],
  },
  {
    id: 2,
    title: "Et ratione distinctio nesciunt recusandae vel ab?",
    href: "#",
    author: { name: "Michael F.", href: "#" },
    date: "2d ago",
    dateTime: "2023-01-23T19:20Z",
    status: "active",
    totalComments: 6,
    commenters: [
      {
        id: 13,
        name: "Alicia Bell",
        imageUrl:
          "https://images.unsplash.com/photo-1509783236416-c9ad59bae472?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      {
        id: 16,
        name: "Benjamin Russel",
        imageUrl:
          "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      {
        id: 3,
        name: "Dries Vincent",
        imageUrl:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
    ],
  },
  {
    id: 3,
    title: "Blanditiis perferendis fugiat optio dolor minus ut?",
    href: "#",
    author: { name: "Dries V.", href: "#" },
    date: "3d ago",
    dateTime: "2023-01-22T12:59Z",
    status: "resolved",
    totalComments: 22,
    commenters: [
      {
        id: 19,
        name: "Lawrence Hunter",
        imageUrl:
          "https://images.unsplash.com/photo-1513910367299-bce8d8a0ebf6?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      {
        id: 21,
        name: "Angela Fisher",
        imageUrl:
          "https://images.unsplash.com/photo-1501031170107-cfd33f0cbdcc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      {
        id: 14,
        name: "Jenny Wilson",
        imageUrl:
          "https://images.unsplash.com/photo-1507101105822-7472b28e22ac?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      {
        id: 16,
        name: "Benjamin Russel",
        imageUrl:
          "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
    ],
  },
];

export default function Discussions() {
  return (
    <ul role="list" className="divide-y divide-stroke-dimmed">
      {discussions.map((discussion) => (
        <li
          key={discussion.id}
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-2 sm:flex-nowrap"
        >
          <div>
            <p className="font-semibold leading-6">
              <a
                href={discussion.href}
                className="text-link-base underline underline-offset-2 hover:text-link-hover transition-colors"
              >
                {discussion.title}
              </a>
            </p>
            <p className="mt-1 leading-6 text-content-base">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </p>
            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
              <p>
                <a href={discussion.author.href} className="hover:underline">
                  {discussion.author.name}
                </a>
              </p>
              <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                <circle r={1} cx={1} cy={1} />
              </svg>
              <p>
                <time dateTime={discussion.dateTime}>{discussion.date}</time>
              </p>
            </div>
          </div>
          <dl className="flex w-full flex-none justify-between gap-x-8 sm:w-auto">
            <div className="flex -space-x-0.5">
              <dt className="sr-only">Commenters</dt>
              {discussion.commenters.map((commenter) => (
                <dd key={commenter.id}>
                  <img
                    alt={commenter.name}
                    src={commenter.imageUrl}
                    className="h-6 w-6 rounded-full bg-gray-50 ring-2 ring-white"
                  />
                </dd>
              ))}
            </div>
            <div className="flex w-16 gap-x-2.5">
              <dt>
                <span className="sr-only">Total comments</span>
              </dt>
              <dd className="text-sm leading-6 text-gray-900">
                <CircleWithNumber totalComments={discussion.totalComments} />
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

function GoalSubGoals({ goal, goals, projects }) {
  return (
    <div className="mt-16">
      <Subheader icon={IconListTree} content={"Sub-goals and projects"} />

      <GoalTree
        goals={goals}
        projects={projects}
        options={{
          goalId: goal.id!,
        }}
      />
      <div className="mb-16" />
    </div>
  );
}

function GoalFeed() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Paper.DimmedSection>
      <div className="text-lg font-medium text-content-dimmed mb-4">Activity</div>
      <GoalFeedItems goal={goal} />
    </Paper.DimmedSection>
  );
}

function GoalFeedItems({ goal }) {
  const { data, loading, error } = useItemsQuery("goal", goal.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <Feed items={data!.activities!} page="goal" />;
}
