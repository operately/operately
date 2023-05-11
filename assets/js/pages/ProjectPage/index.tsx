import React from "react";
import { useProject } from "../../graphql/Projects";
import { useParams, Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import Icon from "../../components/Icon";

import { LightningBoltIcon } from "@radix-ui/react-icons";
import AbsoluteTime from "../../components/AbsoluteTime";

function Milestone({ milestone }) {
  return (
    <div className="border-t border-gray-700 flex items-center justify-between">
      <div className="mt-4 flex gap-2 items-center mb-4">
        {milestone.title}
        <Icon name="double checkmark" color="brand" />{" "}
        <span className="text-brand-base">Delivered</span>
      </div>

      <div className="text-right">
        <AbsoluteTime date={milestone.deadlineAt} />
      </div>
    </div>
  );
}

function About({ data }) {
  return (
    <>
      <div className="mt-12">
        <div className="border-t border-b border-gray-700 flex items-center justify-between">
          <div className="mt-4 flex gap-2 items-center mb-4">
            <Avatar person={data.project.owner} />
            <div>
              <div className="font-bold">{data.project.owner.fullName}</div>
              <div className="text-sm">{data.project.owner.title}</div>
            </div>
          </div>

          <div className="text-right">
            <div>Next update scheduled for May 20st, 2023.</div>
            <a className="underline" href="#">
              Request an earlier status update
            </a>
          </div>
        </div>
      </div>

      <div className="text-xl mt-8">
        <p>
          Software development teams are constantly striving to improve their
          processes to deliver high-quality software faster and more
          efficiently. The DevOps Research and Assessment (DORA) metrics are
          widely recognized as a standard for measuring software development
          performance. However, collecting and analyzing DORA metrics can be a
          challenging and time-consuming task. To address this need, we propose
          "Superpace," a software tool designed to help teams and organizations
          improve their software development processes using the DORA metrics.
        </p>

        <p className="mt-4">
          The primary objective of "Superpace" is to provide a comprehensive
          view of an organization's software development processes, enabling
          teams to identify areas for improvement and optimize their workflows.
          The tool focuses on the four key areas of DORA metrics, which are
          deployment frequency, lead time for changes, mean time to restore
          (MTTR), and change failure rate. By collecting and analyzing data from
          various sources, including code repositories, continuous
          integration/continuous delivery (CI/CD) systems, and issue tracking
          systems, "Superpace" will provide teams with valuable insights to make
          informed decisions.
        </p>
      </div>

      <div className="mt-16">
        <h1 className="uppercase font-bold mb-4">Milestones</h1>

        {data.project.milestones.map((milestone) => (
          <Milestone key={milestone.id} milestone={milestone} />
        ))}
      </div>
    </>
  );
}

function Timeline({ data }) {
  return "Timeline";
}

function Activity({ data }) {
  return (
    <div className="relative fadeIn">
      <div className="absolute top-1 bottom-1 left-5 border-l border-gray-700"></div>

      <div className="bg-[#303030] rounded-lg mb-8 relative z-30 -mx-6">
        <div className="mt-8 flex gap-2 items-center mb-4 z-20 relative px-6 pt-6">
          <div className="absolute right-9">May 10th</div>

          <Avatar person={data.project.owner} />
          <div>
            <div className="font-bold">{data.project.owner.fullName}</div>
            <div className="text-sm">{data.project.owner.title}</div>
          </div>
        </div>
        <div className="text-xl px-8 pt-4 pb-2">
          <div className="uppercase text-xs mb-6 font-bold">STATUS UPDATE</div>
          We have hit a roadblock in the development of the "Superpace", which
          has been preventing us from moving forward with the development and
          testing phase. Our team is working diligently to identify the root
          cause of the issue, and we are exploring all possible solutions. We
          understand the importance of delivering a high-quality software tool
          on time and within budget and are committed to doing so. We will keep
          you informed of our progress and provide regular updates on the status
          of the project.
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
        <div className="flex items-center gap-1 mb-2">
          <Link to="/company" className="font-semibold">
            Rendered Text
          </Link>

          <div className="scale-75">
            <Icon name="chevron right" size="small" color="dark-2"></Icon>
          </div>

          <Link to="/objectives" className="font-semibold">
            Profitable Growth
          </Link>

          <div className="scale-75">
            <Icon name="chevron right" size="small" color="dark-2"></Icon>
          </div>

          <Link to="/objectives" className="font-semibold">
            Expand into the enterprise market
          </Link>
        </div>

        <div className="text-new-dark-3 bg-new-dark-2 rounded px-32 pb-16 pt-16 fadeIn relative">
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

          <h1 className="font-bold text-5xl text-center relative z-20">
            {data.project.name}
          </h1>

          <div className="text-center mt-4 relative z-20">
            <div>
              In Design Phase &middot; Delivery expected before September 1st,
              2023.
            </div>
            <div>Next milestone: Present GTM strategy.</div>
          </div>

          <div className="flex items-center justify-center mb-8 gap-2 mt-4">
            <div
              className={
                "border rounded-full border-gray-700 px-3 py-1 " +
                (activeTab === "about" ? "bg-gray-700" : "")
              }
              onClick={() => setActiveTab("about")}
              children="About"
            />

            <div
              className={
                "border rounded-full border-gray-700 px-3 py-1 " +
                (activeTab === "timeline" ? "bg-gray-700" : "")
              }
              onClick={() => setActiveTab("timeline")}
              children="Timeline"
            />

            <div
              className={
                "border rounded-full border-gray-700 px-3 py-1 " +
                (activeTab === "activity" ? "bg-gray-700" : "")
              }
              onClick={() => setActiveTab("activity")}
              children="Activity"
            />
          </div>

          {activeTab === "about" && <About data={data} />}
          {activeTab === "timeline" && <Timeline data={data} />}
          {activeTab === "activity" && <Activity data={data} />}
        </div>
      </div>
    </div>
  );
}
