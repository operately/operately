import React, { useState, useMemo } from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

import Banner from "./Banner";
import Header from "./Header";
import Overview from "./Overview";
import Timeline from "./Timeline";
import Navigation from "./Navigation";
import Button, { GhostButton } from "@/components/Button";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import RichContent, { countCharacters, shortenContent, Summary } from "@/components/RichContent";
import { ResourceIcon } from "@/components/KeyResourceIcon";

import { Feed, useItemsQuery } from "@/features/Feed";
import { DimmedLabel } from "./Label";

import * as People from "@/models/people";
import { Link } from "@/components/Link";

import { useLoadedData } from "./loader";
import { Paths } from "@/routes/paths";
import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";
import Options from "./Options";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={project.name!}>
      <Paper.Root size="large">
        <Navigation space={project.space!} />

        <Paper.Body>
          <Banner project={project} />
          <Options project={project} />

          <div className="mb-8">
            <Header project={project} />
          </div>

          <div className="">
            <Overview project={project} />

            <div className="mt-4" />

            <div className="border-t border-stroke-base py-6">
              <div className="flex items-start gap-4">
                <div className="w-1/5">
                  <div className="font-bold text-sm">Overview</div>

                  <div className="text-sm">
                    {showEditDescription(project) && (
                      <Link to={Paths.projectEditDescriptionPath(project.id!)} testId="edit-project-description-link">
                        Edit
                      </Link>
                    )}
                  </div>
                </div>

                <div className="w-4/5">
                  <Description project={project} />
                </div>
              </div>
            </div>

            <div className="border-t border-stroke-base py-6">
              <div className="flex items-start gap-4">
                <div className="w-1/5">
                  <div className="font-bold text-sm"><a href="" className="text-black underline underline-offset-2 hover:text-link-hover transition-colors">Timeline</a></div>

                  <div className="text-sm">
                    {showEditMilestones(project) && (
                      <Link to={Paths.projectMilestonesPath(project.id!)} testId="manage-timeline">
                        View
                      </Link>
                    )}
                  </div>
                </div>

                <div className="w-4/5">
                  <Timeline project={project} />
                </div>
              </div>
            </div>

            <CheckInSection project={project} />

            <MessageBoard />

            <div className="border-t border-stroke-base py-6">
              <div className="flex items-start gap-4">
                <div className="w-1/5">
                  <div className="font-bold text-sm"><a href="" className="text-black hover:text-link-hover underline">Resources</a> (4)</div>

                  <div className="text-sm">
                    {showEditResource(project) && (
                      <Link to={Paths.projectEditResourcesPath(project.id!)} testId="edit-resources-link">
                        Edit
                      </Link>
                    )}
                  </div>
                </div>

                <div className="w-4/5">
                  <Resources project={project} />
                </div>
              </div>
            </div>
          </div>

          <Paper.DimmedSection>
            <div className="uppercase text-xs text-content-accent font-semibold mb-4">Project Activity</div>
            <ProjectFeed project={project} />
          </Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ProjectFeed({ project }) {
  const { data, loading, error } = useItemsQuery("project", project.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="project-feed" page="project" />;
}

function LastCheckIn({ project }) {
  const newCheckInPath = Paths.projectCheckInNewPath(project.id);

  const checkInNowLink = (
    <div className="flex">
      <ButtonSecondaryRounded title="Check-in now" url={newCheckInPath} />
    </div>
  );

  if (!project.lastCheckIn) {
    return (
      <div className="text-sm">
        Asking the champion to check-in every Friday.
        {project.permissions.canCheckIn && <div className="mt-2">{checkInNowLink}</div>}
      </div>
    );
  }

  const author = project.lastCheckIn.author;
  const time = project.lastCheckIn.insertedAt;
  const description = project.lastCheckIn.description;
  const status = project.lastCheckIn.status;
  const path = Paths.projectCheckInPath(project.lastCheckIn.id);

  return (
    <div>
      <DimmedLabel>Last Check-In</DimmedLabel>
      <div className="flex items-start gap-2 max-w-xl mt-2">
        <div className="flex flex-col gap-1">
          <div className="font-bold flex items-center gap-1">
            <Avatar person={author} size="tiny" />
            {People.shortName(author)} submitted:
            <Link to={path} testId="last-check-in-link">
              Check-in <FormattedTime time={time} format="long-date" />
            </Link>
          </div>
          <Summary jsonContent={description} characterCount={200} />
        </div>
      </div>

      <div className="flex items-start gap-12 mt-6">
        <div>
          <DimmedLabel>Status</DimmedLabel>
          <div className="flex flex-col gap-1 text-sm">
            <SmallStatusIndicator status={status} />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <DimmedLabel>Next Check-In</DimmedLabel>
            <div className="text-sm font-medium">
              Scheduled for <FormattedTime time={project.nextCheckInScheduledAt} format="relative-weekday-or-date" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">{project.permissions.canCheckIn && checkInNowLink}</div>
    </div>
  );
}

function Resources({ project }) {
  if (project.keyResources.length === 0) {
    return <ResourcesListv2 />;
    //return <ResourcesZeroState project={project} />;
  } else {
    return <ResourcesListv2 />;
  }
}

function ResourcesZeroState({ project }) {
  const editPath = Paths.projectEditResourcesPath(project.id!);

  const editLink = (
    <ButtonSecondaryRounded title="Add Resources" url={editPath} />
  );

  return (
    <div className="text-sm">
      Store and organize files, rich text documents, and links to external resources.
      {project.permissions.canEditResources && <div className="mt-2 flex">{editLink}</div>}
    </div>
  );
}

function ResourcesList({ project }: { project: Projects.Project }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {project.keyResources!.map((resource: any, index: number) => (
        <Resource
          key={index}
          icon={<ResourceIcon resourceType={resource!.resourceType} size={32} />}
          title={resource!.title}
          href={resource!.link}
        />
      ))}
    </div>
  );
}

function ResourcesListv2() {
  return (
    <div className="px-4 pb-6 sm:grid sm:gap-4 sm:px-0">
      <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <ul role="list" className="divide-y divide-gray-100 rounded-md border border-gray-200">
          <li className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6">
            <div className="flex w-0 flex-1 items-center">
            <span className="w-4 h-4 text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
</svg>
</span>
              <div className="ml-4 flex min-w-0 flex-1 gap-2">
                <span className="truncate font-medium">
                  <a href="" className="text-black hover:underline">Budget v2</a>
                </span>
                <span className="flex-shrink-0 text-gray-400">Google Spreadsheet</span>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <a href="#" className="font-medium text-link-base hover:text-link-hover">
                Open
              </a>
            </div>
          </li>
          <li className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6">
            <div className="flex w-0 flex-1 items-center">
            <span className="w-4 h-4 text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
</svg></span>
              <div className="ml-4 flex min-w-0 flex-1 gap-2">
                <span className="truncate font-medium">
                  <a href="" className="text-black hover:underline">how_to_win_friends_and_influence_people.pdf</a>
                </span>
                <span className="flex-shrink-0 text-gray-400">4.5mb</span>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <a href="#" className="font-medium text-link-base hover:text-link-hover">
                Download
              </a>
            </div>
          </li>
          <li className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6">
            <div className="flex w-0 flex-1 items-center">
            <span className="w-4 h-4 text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
</svg>
</span>
              <div className="ml-4 flex min-w-0 flex-1 gap-2">
                <span className="truncate font-medium">
                  <a href="" className="text-black hover:underline">Project Iteration #5 Brief</a>
                </span>
                <span className="flex-shrink-0 text-gray-400">doc</span>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <a href="#" className="font-medium text-link-base hover:text-link-hover">
                Open
              </a>
            </div>
          </li>
        </ul>
        <div className="mt-2 text-xs text-gray-500 flex justify-end items-center space-x-2 mr-2">
          <span>Showing 3 most recent</span>
          <span>•</span>
          <a href="#" className="text-link-base hover:text-link-hover">View all</a>
        </div>
      </dd>
    </div>
  )
}

function Resource({ icon, title, href }) {
  return (
    <a
      href={href}
      target="_blank"
      className="rounded border border-stroke-base hover:border-surface-outline cursor-pointer flex flex-col items-center justify-center text-center"
    >
      <div className="pt-6 pb-3">{icon}</div>
      <div className="pb-6 px-5">
        <div className="text-content-accent text-sm font-semibold leading-snug">{title}</div>
      </div>
    </a>
  );
}

function Description({ project }) {
  const LIMIT = 250;

  const [showMore, setShowMore] = useState(false);
  const length = useMemo(() => (project.description ? countCharacters(project.description) : 0), []);

  const truncatedDescription = useMemo(() => {
    if (!project?.description) return;

    return shortenContent(project.description, LIMIT, { suffix: "..." });
  }, []);

  if (project.description) {
    if (length < LIMIT) {
      return <RichContent jsonContent={project.description} />;
    } else {
      return (
        <div>
          <RichContent jsonContent={showMore ? project.description : truncatedDescription} />
          <span
            onClick={() => setShowMore(!showMore)}
            className="text-sm text-link-base underline underline-offset-2 cursor-pointer"
            data-test-id="expand-project-description"
          >
            {showMore ? "Collapse" : "Expand"}
          </span>
        </div>
      );
    }
  } else {
    return <DescriptionZeroState project={project} />;
  }
}

function DescriptionZeroState({ project }) {
  const writePath = Paths.projectEditDescriptionPath(project.id!);

  const editLink = (
    <ButtonSecondaryRounded title="Write project description" url={writePath} />
  );

  return (
    <div className="text-sm">
      Describe your project to provide context and clarity.
      {project.permissions.canEditDescription && <div className="mt-2 flex">{editLink}</div>}
    </div>
  );
}

function showEditResource(project: Projects.Project) {
  if (!project.permissions!.canEditResources) return false;

  const resources = project.keyResources || [];

  return resources.length > 0;
}

function showEditDescription(project: Projects.Project) {
  if (!project.permissions!.canEditDescription) return false;

  return project.description !== null;
}

function showEditMilestones(project: Projects.Project) {
  if (!project.permissions!.canEditMilestone) return false;

  const milestones = project.milestones || [];

  return milestones.length > 0;
}


function CheckInSection({ project }) {
  return (
    <div className="border-t border-stroke-base py-6">
      <div className="flex items-start gap-4">
        <div className="w-1/5">
          <div className="font-bold text-sm"><a href="" className="text-black underline underline-offset-2 hover:text-link-hover transition-colors">Check-Ins</a> (3)</div>
          {project.lastCheckIn && (
            <div className="text-sm">
              <Link to={Paths.projectCheckInsPath(project.id!)}>View all</Link>
            </div>
          )}
        </div>

        <div className="w-">
          <LastCheckIn project={project} />
        </div>
      </div>
    </div>
  );
}

function MessageBoard() {
  return (
    <div className="border-t border-stroke-base py-6">
      <div className="flex items-start gap-4">
        <div className="w-1/5">
          <div className="font-bold text-sm mb-6">
            <a href="" className="text-black underline underline-offset-2 hover:text-link-hover transition-colors">Message Board</a> (5)
          </div>
        </div>

        <div className="w-4/5">
          <Discussions />
          <div className="flex flex-col items-start gap-2 mb-4">
            <ButtonSecondaryRounded title="Write a new message" url="" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CircleWithNumber({totalComments}) {
  return (
    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
      <span className="text-white-1 text-xs font-bold">{totalComments}</span>
    </div>
  );
}

function ButtonSecondaryRounded({title, url}) {
  return (
    <a href={url} class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">{title}</a>
  );
}

const discussions = [
  {
    id: 1,
    title: 'Atque perspiciatis et et aut ut porro voluptatem blanditiis?',
    href: '#',
    author: { name: 'Leslie A.', href: '#' },
    date: '2d ago',
    dateTime: '2023-01-23T22:34Z',
    status: 'active',
    totalComments: 24,
    commenters: [
      {
        id: 12,
        name: 'Emma Dorsey',
        imageUrl:
          'https://images.unsplash.com/photo-1505840717430-882ce147ef2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        id: 6,
        name: 'Tom Cook',
        imageUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        id: 4,
        name: 'Lindsay Walton',
        imageUrl:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        id: 16,
        name: 'Benjamin Russel',
        imageUrl:
          'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        id: 23,
        name: 'Hector Gibbons',
        imageUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    ],
  },
  {
    id: 2,
    title: 'Et ratione distinctio nesciunt recusandae vel ab?',
    href: '#',
    author: { name: 'Michael F.', href: '#' },
    date: '2d ago',
    dateTime: '2023-01-23T19:20Z',
    status: 'active',
    totalComments: 6,
    commenters: [
      {
        id: 13,
        name: 'Alicia Bell',
        imageUrl:
          'https://images.unsplash.com/photo-1509783236416-c9ad59bae472?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        id: 16,
        name: 'Benjamin Russel',
        imageUrl:
          'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        id: 3,
        name: 'Dries Vincent',
        imageUrl:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    ],
  },
  {
    id: 3,
    title: 'Blanditiis perferendis fugiat optio dolor minus ut?',
    href: '#',
    author: { name: 'Dries V.', href: '#' },
    date: '3d ago',
    dateTime: '2023-01-22T12:59Z',
    status: 'resolved',
    totalComments: 22,
    commenters: [
      {
        id: 19,
        name: 'Lawrence Hunter',
        imageUrl:
          'https://images.unsplash.com/photo-1513910367299-bce8d8a0ebf6?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        id: 21,
        name: 'Angela Fisher',
        imageUrl:
          'https://images.unsplash.com/photo-1501031170107-cfd33f0cbdcc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        id: 14,
        name: 'Jenny Wilson',
        imageUrl:
          'https://images.unsplash.com/photo-1507101105822-7472b28e22ac?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        id: 16,
        name: 'Benjamin Russel',
        imageUrl:
          'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    ],
  }
]

export default function Discussions() {
  return (
    <ul role="list" className="divide-y divide-gray-100">
      {discussions.map((discussion) => (
        <li
          key={discussion.id}
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pb-5 sm:flex-nowrap"
        >
          <div>
            <p className="text-sm font-semibold leading-6 text-gray-900">
              <a href={discussion.href} className="text-link-base underline underline-offset-2 hover:text-link-hover transition-colors">
                {discussion.title}
              </a>
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-700">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
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
              <dd className="text-sm leading-6 text-gray-900"><CircleWithNumber totalComments={discussion.totalComments} /></dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}
