import React from "react";
import { useProject } from "../../graphql/Projects";
import { useParams } from "react-router-dom";
import Avatar, { AvatarSize } from "../../components/Avatar";
import Icon from "../../components/Icon";
import * as Icons from "tabler-icons-react";

import * as PaperContainer from "../../components/PaperContainer";
import * as PhasePills from "../../components/PhasePills";
import * as Tabs from "../../components/Tabs";
import FormattedTime from "@/components/FormattedTime";

import Overview from "./Overview";
import Timeline from "./Timeline";
import Activity from "./Activity";
import Contributors from "./Contributors";

function SmallStatusUpdate({
  person,
  acknowledged,
  title,
  message,
  comments,
  time,
}) {
  return (
    <div className="flex items-start justify-between gap-4 hover:cursor-pointer hover:bg-shade-1 px-4 py-4 border-b border-shade-3">
      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-2">
          <Avatar person={person} size={AvatarSize.Small} />
        </div>

        <div className="">
          <div className="text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="font-bold">{title}</div>
              </div>

              <div className="flex items-center gap-1 text-sm">{time}</div>
            </div>
            <div className="line-clamp-2">{message}</div>
          </div>

          <div className="text-sm mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1 font-medium">
              {acknowledged ? (
                <div className="flex items-center gap-1 text-green-400">
                  <Icons.CircleCheck size={14} className="text-green-400 " />{" "}
                  acknowledged
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Icons.Clock size={14} className="text-yellow-400" />
                  waiting
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Icons.MessageCircle size={14} /> {comments} comments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

SmallStatusUpdate.defaultProps = {
  acknowledged: false,
};

function Flare() {
  return (
    <div
      className="absolute"
      style={{
        top: 0,
        left: 0,
        right: 0,
        height: "500px",
        background:
          "radial-gradient(circle at top center, #FFFF0008 0%, #00000000 50%)",
        pointerEvents: "none",
      }}
    ></div>
  );
}

function Phase({ name, deadline, state }) {
  return (
    <div className="gap-4 py-1 w-1/5 px-4">
      <div className="flex items-center gap-2 text-white-1 text-sm font-bold">
        {name}
      </div>
      <div className="flex items-center gap-2 text-white-1 text-xs uppercase">
        {deadline || "Not Set"}
      </div>
    </div>
  );
}

function Badge({ title, className }): JSX.Element {
  return (
    <div
      className={className + " font-bold uppercase flex items-center"}
      style={{
        padding: "4px 10px 2px",
        borderRadius: "25px",
        fontSize: "12.5px",
        lineHeight: "20px",
        height: "24px",
        letterSpacing: "0.03em",
        display: "flex",
        gap: "10",
        marginTop: "2px",
      }}
    >
      {title}
    </div>
  );
}

function ProjectHeader({ name }): JSX.Element {
  return (
    <div className="">
      <div className="mb-2 flex items-center gap-2">
        RenderedText
        <Icon name="chevron right" size="tiny" color="dark-2" />
        Increase Revenue
        <Icon name="chevron right" size="tiny" color="dark-2" />
        Optimize operations in order to increase revenue
      </div>
      <div className="flex gap-3.5 items-center mt-4">
        <h1 className="font-bold text-5xl">{name}</h1>
      </div>
    </div>
  );
}

function ProjectPhases(): JSX.Element {
  return (
    <PhasePills.Container>
      <PhasePills.Item name="Concept" state="done" />
      <PhasePills.Item name="Planning" state="done" />
      <PhasePills.Item name="Execution" state="inProgress" />
      <PhasePills.Item name="Control" state="pending" />
      <PhasePills.Item name="Closing" state="pending" />
    </PhasePills.Container>
  );
}

function ChampionCrown() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="14" height="14" rx="3" fill="#3185FF" />
      <path
        d="M7 3.5L9.33333 7L12.25 4.66667L11.0833 10.5H2.91667L1.75 4.66667L4.66667 7L7 3.5Z"
        fill="#FFE600"
      />
    </svg>
  );
}
function ContributorList({ owner, contributors }): JSX.Element {
  return (
    <div className="flex gap-3 flex-wrap">
      <div>
        <Avatar person={owner} size={AvatarSize.Small} />
      </div>
      <div>
        <Avatar person={contributors[2].person} size={AvatarSize.Small} />
      </div>

      {contributors.map((c, index: number) => (
        <div>
          <Avatar person={c.person} size={AvatarSize.Small} />
        </div>
      ))}
    </div>
  );
}

function Champion({ person }): JSX.Element {
  return (
    <div>
      <div className="flex items-center gap-2 uppercase text-sm font-medium tracking-wide mb-4">
        Champion
      </div>

      <div className="flex items-center gap-2 font-medium">
        <Avatar person={person} size={AvatarSize.Normal} />{" "}
        <div>
          <div className="font-bold">{person.fullName}</div>
          <div className="text-sm">{person.title}</div>
        </div>
      </div>
    </div>
  );
}

function KeyResources(): JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-shade-1 px-4 py-3 flex items-center gap-2 rounded-lg">
        <Icons.BrandGithub size={20} />
        GitHub Repository
      </div>

      <div className="bg-shade-1 px-4 py-3 flex items-center gap-2 rounded-lg">
        <Icons.BrandSlack size={20} />
        Slack Channel
      </div>

      <div className="border border-shade-3 border-dashed px-4 py-3 flex items-center gap-2 rounded-lg">
        <Icons.Plus size={20} />
        Add Resource
      </div>
    </div>
  );
}

export function ProjectPage() {
  const params = useParams();

  const id = params["id"];
  const tab = params["*"] || "";

  if (!id) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data } = useProject(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  let project = data.project;

  return (
    <div className="mt-32 mx-auto max-w-7xl relative">
      <div className="py-16 bg-dark-1 pb-32 -mb-20 -mx-96 px-96 -mt-48 pt-40 border-b-2 border-shade-3 border-double relative">
        <Flare />

        <div className="flex items-center mb-4">
          <div className="text-sm bg-shade-1 rounded-full px-4 py-2 font-medium">
            &lt;&mdash; All Projects
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <div className="font-bold text-4xl">{project.name}</div>
          </div>

          <div className="flex items-center gap-2">
            <button className="border border-white-3 rounded-lg hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium flex items-center gap-2">
              <Icons.Star size={16} className="text-yellow-400" />
              Follow
            </button>

            <button className="border border-white-3 rounded-lg hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium flex items-center gap-2 text-green-400 border-green-400">
              On Track
              <Icons.ChevronDown size={16} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative border-2 rounded-full border-yellow-400 p-0.5">
            <Avatar person={project.owner} size={AvatarSize.Small} />
          </div>

          {project.contributors.map((c, index: number) => (
            <Avatar person={c.person} size={AvatarSize.Small} />
          ))}

          <div className="border border-white-3 border-dashed rounded-full p-1 text-white-3">
            <Icons.Plus />
          </div>
        </div>
      </div>

      <div className="flex gap-5">
        <div className="w-2/3 bg-shade-1 pb-8 px-8 rounded-lg border border-shade-3 backdrop-blur">
          <div className="flex items-center -mx-8 border-b border-shade-2">
            <div className="font-bold flex items-center gap-2 border-b-2 border-white-2 -mb-[1px] px-4 py-4">
              <Icons.LayoutCollage size={20} className="text-pink-400" />
              Overview
            </div>

            <div className="font-bold flex items-center gap-2 border-b-2 border-transparent -mb-[1px] px-4 py-4 text-white-2">
              <Icons.Map2 size={20} />
              Timeline
            </div>

            <div className="font-bold flex items-center gap-2 border-b-2 border-transparent -mb-[1px] px-4 py-4 text-white-2">
              <Icons.Users size={20} />
              Contributors
            </div>
          </div>

          <div className="border-b border-shade-2 py-4 -mx-8 px-8 mt-4 pb-10">
            <Overview data={data} />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2 uppercase font-bold tracking-wide">
              GOALS & KPIs
            </div>
          </div>

          <div className="border-b border-shade-2 py-4 -mx-8 px-8 pb-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-shade-1 rounded-lg">
                <Icons.Target size={20} className="text-pink-400" /> Increase
                revenue by 20% by the end of Q3
              </div>

              <div className="flex items-center justify-between px-4 py-3 bg-shade-1 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icons.Graph size={20} className="text-lime-400" /> Montlhy
                  Reccuring Revenue
                </div>

                <div className="font-bold flex items-center">
                  $ 10,451,321
                  <Icons.TrendingUp size={20} className="text-green-400 ml-2" />
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-3 border border-shade-3 rounded-lg border-dashed">
                <Icons.Plus size={20} /> Add Goal or KPI
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 uppercase font-bold tracking-wide">
              KEY RESOURCES
            </div>
          </div>

          <KeyResources />
        </div>

        <div className="w-1/3 bg-shade-1 backdrop-blur rounded-lg border border-shade-3">
          <div className="">
            <div className="flex items-center border-b border-shade-3 justify-between px-4">
              <div className="font-bold py-4 flex items-center gap-2">
                Status Updates
              </div>

              <button className="border border-white-3 rounded-lg hover:border-white-2 text-white-1 hover:text-white-1 px-3 py-1.5 text-sm font-medium flex items-center gap-2">
                <Icons.Message2 size={20} className="text-violet-400" />
                Post Update
              </button>
            </div>

            <div className="flex flex-col">
              <SmallStatusUpdate
                person={project.owner}
                title="Status Update"
                message="We have completed the first milestone and we are on track to complete the project on time"
                comments={3}
                time="Mar 24th"
              />
              <SmallStatusUpdate
                person={project.owner}
                acknowledged
                title="Status Update"
                message="The project is going well and we are expecting the finish all the work on time"
                comments={0}
                time="Mar 17th"
              />
              <SmallStatusUpdate
                person={project.owner}
                acknowledged
                title="Status Update"
                message="The outages are still happening and we are working on a fix. We will keep you updated."
                comments={10}
                time="Mar 10th"
              />
              <SmallStatusUpdate
                person={project.owner}
                acknowledged
                title="Status Update"
                message="We are currently working on delivering the first milestone which is due next week."
                comments={0}
                time="Mar 2nd"
              />
              <SmallStatusUpdate
                person={project.contributors[0].person}
                acknowledged
                title="Request for Project Review"
                message="I haven't heard any news about the project for a while. Can you please provide an update?"
                comments={1}
                time="Mar 1st"
              />
              <SmallStatusUpdate
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
      </div>
    </div>
  );
}
// <div className="w-2/3 shrink-0 px-8 py-4 pr-4">
//   <div className="flex items-center justify-between mb-4">
//     <div className="flex items-center gap-2 uppercase text-sm font-medium tracking-wide">
//       DESCRIPTION
//     </div>
//     <div>
//       <Icon name="edit" size="small" color="dark-2" />
//     </div>
//   </div>

//   <div className="-ml-8 px-8 bg-shade-1 py-8 -mr-4">
//   </div>
// </div>

// <div className="w-1/3 shrink-0 flex flex-col gap-12 bg-dark-3 px-4 py-4 border-l-2 border-shade-1">

// </div>
// <PaperContainer.Root>
//   <PaperContainer.Navigation>
//     <PaperContainer.NavigationItem
//       icon="objectives"
//       title={parent.title}
//       to={`/objectives/${parent.id}`}
//     />
//   </PaperContainer.Navigation>

//   <PaperContainer.Body>
//     <div className="bg-dark-2 border-2 border-shade-1 px-32 py-4 rounded-lg">
//       <div className="mb-8 flex flex-col justify-between gap-8">
//         <div className="gap-4">
//           <div className="text-4xl font-bold my-8 text-center">
//           </div>
//           <div className="text-center">
//             In Execution Phase &middot; Delivery expected in 81 days
//           </div>
//         </div>

//         <ContributorList
//           owner={project.owner}
//           contributors={project.contributors}
//         />

//         <div className="flex items-center border-b border-white-3">
//           <div className="flex items-center gap-2 border-b border-white-1 -mb-[1px] pb-2 px-4">
//             <Icons.LayoutBoard size={16} />
//             Overview
//           </div>

//           <div className="flex items-center gap-2 border-b border-transparent -mb-[1px] pb-2 px-4 text-white-2">
//             <Icons.ArrowBigUpLines size={16} />
//             Roles
//           </div>

//           <div className="flex items-center gap-2 border-b border-transparent -mb-[1px] pb-2 px-4 text-white-2">
//             <Icons.Message size={16} />
//             Updates{" "}
//             <div className="w-5 h-5 rounded-full bg-gray-700 text-center text-xs flex items-center justify-center">
//               12
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center justify-between gap-4 shrink-0">
//           <div className="flex items-center justify-between gap-4">
//           </div>
//         </div>

//         <div className="flex items-start gap-10">
//           <div className="w-2/3">
//             <Overview data={data} />
//           </div>

//           <div className="w-1/3 flex flex-col gap-16">
//             <KeyResources />
//           </div>
//         </div>
//       </div>
//     </div>
//   </PaperContainer.Body>
// </PaperContainer.Root>
