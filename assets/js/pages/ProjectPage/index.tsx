import React from "react";
import { useProject } from "../../graphql/Projects";
import { useParams, Link } from "react-router-dom";
import Avatar, { AvatarSize } from "../../components/Avatar";
import Icon from "../../components/Icon";

import { Cross1Icon, ShuffleIcon } from "@radix-ui/react-icons";

import { LightningBoltIcon } from "@radix-ui/react-icons";
import AbsoluteTime from "../../components/AbsoluteTime";
import RelativeTime from "../../components/RelativeTime";
import { useMe } from "../../graphql/Me";

function Milestone({ milestone }) {
  return (
    <div className="border-t border-gray-700 flex items-center justify-between">
      <div className="mt-4 flex gap-2 items-center mb-4">
        {milestone.status === "done" ? (
          <div className="border-2 border-brand-base h-7 w-7 rounded-full flex items-center justify-center cursor-pointer">
            <Icon name="checkmark" color="brand" size="small" />{" "}
          </div>
        ) : (
          <div className="border-2 border-gray-700 h-7 w-7 rounded-full flex items-center justify-center hover:border-brand-base cursor-pointer"></div>
        )}
        {milestone.title}
      </div>

      <div className="text-right">
        <AbsoluteTime date={milestone.deadlineAt} />
      </div>
    </div>
  );
}

function Milestones({ milestones }) {
  let sortedMilestones = [].concat(milestones).sort((m1, m2) => {
    let d1 = +new Date(m1.deadlineAt);
    let d2 = +new Date(m2.deadlineAt);

    return d1 - d2;
  });

  return (
    <div className="mt-16">
      <h1 className="uppercase font-bold mb-4">Milestones</h1>

      {sortedMilestones.map((milestone) => (
        <Milestone key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
}

function About({ data }) {
  return (
    <div className="fadeIn">
      <div className="mt-12">
        <div className="border-t border-b border-gray-700 flex items-center justify-between py-4">
          {data.project.owner ? (
            <div className="flex gap-2 items-center">
              <Avatar person={data.project.owner} />
              <div>
                <div className="font-bold flex gap-1 items-center">
                  {data.project.owner.fullName}
                  <ChampionBadge />
                </div>
                <div className="text-sm">{data.project.owner.title}</div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <Icon name="user" size="large" color="dark-2" />
              <div>
                <div className="font-bold">No Champion</div>
                <a className="underline" href="#">
                  Assing Now
                </a>
              </div>
            </div>
          )}

          <div className="text-right">
            <div>Next update scheduled for May 20st, 2023.</div>
            <a className="underline" href="#">
              Request an earlier status update
            </a>
          </div>
        </div>
      </div>

      <div className="text-xl mt-8 flex flex-col gap-4">
        {(data.project.description || "").split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <Milestones milestones={data.project.milestones} />
    </div>
  );
}

function Timeline({ data }) {
  return <div>Timeline</div>;
}

function ChampionBadge() {
  return (
    <div className="text-xs uppercase bg-brand-base px-1 py-0.5 rounded">
      Champion
    </div>
  );
}

function Contributors({ data }) {
  return (
    <div className="fadeIn">
      <div className="mt-12">
        <div className="border-t border-b border-gray-700 flex items-center justify-between py-4">
          {data.project.owner ? (
            <div className="flex gap-2 items-center">
              <Avatar person={data.project.owner} />
              <div>
                <div className="font-bold flex gap-2 items-center">
                  {data.project.owner.fullName} <ChampionBadge />
                </div>
                <div className="">
                  Responsible for achieving results on this project and for
                  providing timely updates
                </div>
              </div>
            </div>
          ) : (
            <div></div>
          )}

          <div>
            <div className="hover:bg-gray-700 p-2.5 border border-gray-700 rounded-full cursor-pointer transition">
              <ShuffleIcon />
            </div>
          </div>
        </div>

        {data.project.contributors.map((c) => (
          <div className="border-t border-b border-gray-700 flex items-center justify-between py-4">
            <div className="flex gap-2 items-center">
              <Avatar person={c.person} />

              <div>
                <div className="flex gap-1 items-center">
                  <span className="font-bold">{c.person.fullName}</span>{" "}
                  &middot; {c.person.title}
                </div>
                <div className="">{c.responsibility}</div>
              </div>
            </div>

            <div>
              <div className="hover:bg-gray-700 p-2.5 border border-gray-700 rounded-full cursor-pointer transition">
                <Cross1Icon />
              </div>
            </div>
          </div>
        ))}

        <div className="border-t border-b border-gray-700 flex items-center justify-between py-4">
          <div className="flex gap-2 items-center">
            <div className="mx-2">
              <Icon name="plus" size="base" color="dark-2" />
            </div>
            Add Contributors
          </div>
        </div>
      </div>
    </div>
  );
}

function UpdateComment({ comment }) {
  return (
    <div className="flex items-start gap-4 border-t border-gray-700 p-4 px-7">
      <div className="mt-1">
        <Avatar person={comment.author} size={AvatarSize.Small} />
      </div>
      <div className="w-full">
        <div className="flex gap-1 justify-between">
          <div className="flex gap-1 justify-between">
            <div className="font-bold">{comment.author.fullName}</div>
            &middot;
            <div className="text-sm text-gray-400">{comment.author.title}</div>
          </div>

          <div className="text-gray-300 mr-1">
            <RelativeTime date={comment.insertedAt} />
          </div>
        </div>
        <div className="mt-1">{comment.content}</div>
      </div>
    </div>
  );
}

function Update({ update }) {
  const { data, loading, error } = useMe();

  if (loading || error) return "";

  const me = data.me;

  return (
    <div className="bg-[#303030] rounded-lg mb-8 relative z-30 -mx-6 overflow-hidden">
      <div className="px-4 py-4 flex items-center justify-between bg-new-dark-2">
        <div className="text-lg flex gap-2 items-center">
          {update.author.fullName.split(" ")[0]} is waiting for you to
          acknowlegde this update.
        </div>
        <div className="flex rounded-lg border border-brand-base px-2 py-1 hover:border-brand-base cursor-pointer transition">
          <Icon name="double checkmark" color="light" hoverColor="light" /> Ack
        </div>
      </div>

      <div className="flex gap-2 items-center mb-4 z-20 relative px-6 pt-6">
        <div className="absolute right-9">
          <RelativeTime date={update.insertedAt} />
        </div>

        <Avatar person={update.author} />
        <div>
          <div className="font-bold">{update.author.fullName}</div>
          <div className="text-sm">{update.author.title}</div>
        </div>
      </div>

      <div className="text-xl px-8 pt-4 pb-2">
        <div className="uppercase text-xs mb-6 font-bold">STATUS UPDATE</div>
        {update.content}
      </div>

      <div className="pb-4 pt-4 px-8 flex items-center gap-2">
        <div className="flex rounded-lg border border-gray-700 px-2 py-1 hover:border-brand-base cursor-pointer transition">
          <Icon name="like" color="light" hoverColor="light" />
        </div>
      </div>

      {update.comments.map((c, i) => (
        <UpdateComment key={i} comment={c} />
      ))}

      <div className="flex items-center gap-4 border-t border-gray-700 p-4 px-7">
        <div className="mt-1">
          <Avatar person={me} size={AvatarSize.Small} />
        </div>
        <div className="text-gray-300">Leave a comment &hellip;</div>
      </div>
    </div>
  );
}

function Activity({ data }) {
  return (
    <div className="relative fadeIn">
      <div className="absolute top-1 bottom-1 left-5 border-l border-gray-700"></div>

      {data.project.updates.map((u, i) => (
        <Update key={i} update={u} />
      ))}

      <div className="mt-4 flex gap-2 items-center mb-4 z-20 relative">
        <div className="absolute right-2">Apr 15th</div>
        <div className="border border-brand-base p-2 rounded-full bg-brand-base ml-1">
          <LightningBoltIcon />
        </div>
        Melania Rees requested an out-of-schedule status update.
      </div>

      <div className="mt-6 flex gap-2 items-center mb-4 z-20 relative">
        <div className="absolute right-2">Apr 15th</div>
        <div className="border border-gray-700 p-2 rounded-full bg-gray-700 ml-1">
          <LightningBoltIcon />
        </div>
        Deadline changed from 1st August to 1st September
      </div>

      <div className="mt-6 flex gap-2 items-center mb-4 z-20 relative">
        <div className="absolute right-2">Apr 15th</div>
        <div className="border border-gray-700 p-2 rounded-full bg-gray-700 ml-1">
          <LightningBoltIcon />
        </div>
        Deadline changed from 1st July to 1st August
      </div>

      <div className="bg-[#303030] rounded-lg mb-8 relative z-30 -mx-6">
        <div className="mt-8 flex gap-2 items-center mb-4 z-20 relative px-6 pt-6">
          <div className="absolute right-9">Apr 15th</div>

          <Avatar person={data.project.owner} />
          <div>
            <div className="font-bold">{data.project.owner.fullName}</div>
            <div className="text-sm">{data.project.owner.title}</div>
          </div>
        </div>
        <div className="text-xl px-8 pt-4 pb-2">
          <div className="uppercase text-xs mb-6 font-bold">STATUS UPDATE</div>
          Superpace development progressing on-track. UI design and alerts
          system developed. Integration with popular software tools underway.
          Data security and privacy measures implemented. On-time and within
          budget. Next phase is deployment and integration. Committed to
          high-quality product. Further updates to follow.
        </div>

        <div className="pb-4 pt-4 px-8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="double checkmark" color="brand" />
            <div className="mt-[2px]">
              Status update acknowlegded by Matyas Kiraly, Petar Petrov, and 3
              others
            </div>
          </div>

          <div className="flex rounded-lg border border-gray-700 px-2 py-1 hover:border-brand-base cursor-pointer transition">
            <Icon name="double checkmark" color="light" hoverColor="light" />{" "}
            Ack
          </div>
        </div>

        <div>
          <div className="flex items-start gap-4 border-t border-gray-700 p-4 px-7">
            <div className="mt-1">
              <Avatar
                person={{ fullName: "Franc Fasbender", id: 1 }}
                size="small"
              />
            </div>
            <div>
              <div className="flex gap-1">
                <div className="font-bold">Franc Fasbender</div>
                &middot;
                <div className="text-sm">Head of Business Development</div>
                &middot;
                <div>May 1st</div>
              </div>
              <div className="">
                Bravo! Great to see that the development of Superpace is
                on-track. Where can I take a peak at the UI design?
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 border-t border-gray-700 p-4 px-7">
            <div className="mt-1">
              <Avatar
                person={{ fullName: "Darko Fabijan", id: 1 }}
                size="small"
              />
            </div>
            <div>
              <div className="flex gap-1">
                <div className="font-bold">Darko Fabijan</div>
                &middot;
                <div className="text-sm">Co-Founder</div>
                &middot;
                <div>May 1st</div>
              </div>
              <div className="">
                Visit https://you-mama.ass to see the UI design.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t border-gray-700 p-4 px-7">
            <div className="mt-1">
              <Avatar
                person={{ fullName: "Darko Fabijan", id: 1 }}
                size="small"
              />
            </div>
            <div className="text-gray-500">Leave a comment &hellip;</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 items-center mb-4 z-20 relative">
        <div className="absolute right-2">Apr 15th</div>
        <div className="border border-gray-700 p-2 rounded-full bg-gray-700 ml-1">
          <LightningBoltIcon />
        </div>
        New milestone added: Develop GTM strategy.
      </div>

      <div className="mt-4 flex gap-2 items-center mb-4 z-20 relative">
        <div className="absolute right-2">Apr 15th</div>
        <div className="border border-gray-700 p-2 rounded-full bg-gray-700 ml-1">
          <LightningBoltIcon />
        </div>
        Project name changed from TI to Superpace.
      </div>

      <div className="mt-4 flex gap-2 items-center mb-4 z-20 relative">
        <div className="absolute right-2">Apr 15th</div>
        <div className="border border-gray-700 p-2 rounded-full bg-gray-700 ml-1">
          <LightningBoltIcon />
        </div>
        Project Created by Darko Fabijan
      </div>
    </div>
  );
}

function Tab({ active, title, onClick, badge }) {
  const activeClass = active
    ? "bg-gray-700 cursor-default"
    : "hover:bg-gray-700 cursor-pointer";

  return (
    <div
      className={
        "border rounded-full border-gray-700 px-3 py-1 transition-colors relative flex items-center" +
        " " +
        activeClass
      }
      onClick={onClick}
    >
      {title} {badge}
    </div>
  );
}

function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex items-center justify-center mb-12 gap-2 mt-4">
      <Tab
        active={activeTab === "about"}
        title="About"
        onClick={() => setActiveTab("about")}
      />
      <Tab
        active={activeTab === "contributors"}
        title={
          <>
            Contributors
            <span className="rounded-full bg-gray-600 text-xs ml-2 px-1.5 py-0.5">
              12
            </span>
          </>
        }
        onClick={() => setActiveTab("contributors")}
      />
      <Tab
        active={activeTab === "activity"}
        badge={
          <span className="absolute flex h-3 w-3 rounded-full -top-[4px] -right-[4px] text-xs bg-brand-base items-center justify-center font-bold text-[#222222]">
            <div className="rounded-full absolute top-0 left-0 right-0 bottom-0 bg-brand-base animate-notify"></div>
          </span>
        }
        title={
          <>
            Activity
            <span className="rounded-full bg-gray-600 text-xs ml-2 px-1.5 py-0.5">
              12
            </span>
          </>
        }
        onClick={() => setActiveTab("activity")}
      />
      <Tab
        active={activeTab === "timeline"}
        title="Timeline"
        onClick={() => setActiveTab("timeline")}
      />
    </div>
  );
}

function ChevronRight() {
  return (
    <div className="scale-75">
      <Icon name="chevron right" size="small" color="dark-2"></Icon>
    </div>
  );
}

function NavigationLink({ parent, i }) {
  let path = "";

  switch (parent.type) {
    case "tenet":
      path = "/tenets/" + parent.id;
      break;

    case "project":
      path = "/projects/" + parent.id;
      break;

    case "objective":
      path = "/objective/" + parent.id;
      break;

    case "company":
      path = "/company";
      break;
  }

  return (
    <div key={i} className="flex items-center gap-1">
      {i > 0 ? <ChevronRight /> : null}

      <Link to={path} className="font-semibold">
        {parent.title}
      </Link>
    </div>
  );
}

function Navigation({ parents }) {
  return (
    <div className="flex items-center gap-1 justify-center bg-new-dark-2 mx-8 py-3 text-sm">
      {parents.map((parent, i) => (
        <NavigationLink i={i} parent={parent} />
      ))}
    </div>
  );
}

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
          "radial-gradient(circle at top, #ffff0008 0%, #00000000 60%)",
        pointerEvents: "none",
      }}
    ></div>
  );
}

function LeftActions() {
  return (
    <div className="absolute top-4 left-4">
      <div className="group flex gap-2 items-center cursor-pointer">
        <div>
          <Icon name="star" size="base" color="dark-2"></Icon>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition pointer-events-none mt-1 text-sm font-bold">
          Follow this project
        </div>
      </div>
    </div>
  );
}

function RightActions() {
  return (
    <div className="absolute top-4 right-4">
      <div className="group flex gap-2 items-center cursor-pointer">
        <div className="opacity-0 group-hover:opacity-100 transition pointer-events-none mt-1 text-sm font-bold">
          Edit project
        </div>

        <div>
          <Icon name="edit" size="base" color="dark-2"></Icon>
        </div>
      </div>
    </div>
  );
}

export function ProjectPage() {
  const { id } = useParams();

  if (!id) return <p className="mt-16">Unable to find project</p>;

  const [activeTab, setActiveTab] = React.useState("about");

  const { loading, error, data } = useProject(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;

  return (
    <div className="max-w-6xl mx-auto mb-2">
      <div className="m-11 mt-24 text-gray-400">
        <Navigation parents={data.project.parents} />

        <div className="text-new-dark-3 bg-new-dark-2 rounded px-32 pb-16 pt-16 relative border-2 border-new-dark-2">
          <Flare />
          <LeftActions />
          <RightActions />

          <h1 className="font-bold text-5xl text-center relative z-20">
            {data.project.name}
          </h1>

          <div className="text-center mt-4 relative z-20">
            <div>
              In <span className="underline cursor-pointer">Design</span> Phase
              &middot; Delivery expected before{" "}
              <AbsoluteTime date={data.project.deadline} />
            </div>
            <div>Next milestone: Present GTM strategy.</div>
          </div>

          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === "about" && <About data={data} />}
          {activeTab === "contributors" && <Contributors data={data} />}
          {activeTab === "timeline" && <Timeline data={data} />}
          {activeTab === "activity" && <Activity data={data} />}
        </div>
      </div>
    </div>
  );
}
