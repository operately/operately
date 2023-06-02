import React from "react";
import { useProject } from "../../graphql/Projects";
import { useParams } from "react-router-dom";
import Avatar, { AvatarSize } from "../../components/Avatar";
import Icon from "../../components/Icon";
import * as Icons from "tabler-icons-react";

import * as PaperContainer from "../../components/PaperContainer";
import * as PhasePills from "../../components/PhasePills";
import * as Tabs from "../../components/Tabs";

import Overview from "./Overview";
import Timeline from "./Timeline";
import Activity from "./Activity";
import Contributors from "./Contributors";

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
    <div>
      <div className="flex flex-col gap-2">
        <div className="bg-shade-1 px-2 py-2 flex items-center gap-2 rounded">
          <Icon name="git" size="small" color="light" />
          GitHub Repository
        </div>

        <div className="bg-shade-1 px-2 py-2 flex items-center gap-2 rounded">
          <Icon name="slack" size="small" color="light" />
          Slack Channel
        </div>
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
  let parents = project.parents;
  let parent = parents[parents.length - 1]!;

  return (
    <div className="mt-32 max-w-5xl mx-auto bg-shade-1 px-32 py-16 rounded-lg">
      <div className="flex items-center gap-2 text-2xl font-bold">
        <Icons.ClipboardList size={24} /> {project.name}
      </div>

      <div className="mt-16 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 uppercase text-sm font-medium tracking-wide">
          Description
        </div>
        <div>
          <Icon name="edit" size="small" color="dark-2" />
        </div>
      </div>

      <div className="max-w-3xl mt-8">
        <Overview data={data} />
      </div>

      <div className="mt-16 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 uppercase text-sm font-medium tracking-wide">
          Contributors
        </div>
        <div>
          <Icon name="plus" size="small" color="dark-2" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="flex gap-4 items-center">
          <Avatar person={project.owner} size={AvatarSize.Normal} />
          <div>
            <div className="font-bold">{project.owner.fullName}</div>
            <div className="text-sm text-blue-400 font-bold">
              Project Champion
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="shrink-0">
            <Avatar
              person={project.contributors[0].person}
              size={AvatarSize.Normal}
            />
          </div>
          <div>
            <div className="font-bold">{project.owner.fullName}</div>
            <div className="text-sm font-bold">Project Reviewer</div>
          </div>
        </div>

        {project.contributors.map((c) => (
          <div key={c.person.id} className="flex gap-4 items-center">
            <div className="shrink-0">
              <Avatar person={c.person} size={AvatarSize.Normal} />
            </div>
            <div>
              <div className="font-bold">{c.person.fullName}</div>
              <div className="text-sm text-white-2">{c.responsibility}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 uppercase text-sm font-medium tracking-wide">
          Key Resources
        </div>
        <div>
          <Icon name="plus" size="small" color="dark-2" />
        </div>
      </div>

      <KeyResources />
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
//             <div className="flex items-center justify-between gap-4">
//               <button className="border border-white-3 rounded-lg hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium uppercase flex items-center gap-2">
//                 Pending
//                 <Icons.ChevronDown size={16} />
//               </button>
//             </div>

//             <div className="flex items-center justify-between gap-4">
//               <button className="border border-white-3 rounded-lg hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium uppercase flex items-center gap-2">
//                 Apr 19th &nbsp; -&gt; &nbsp; July 31th
//                 <Icons.ChevronDown size={16} />
//               </button>
//             </div>
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
