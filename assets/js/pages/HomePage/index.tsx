import React from "react";

import { Link } from "react-router-dom";

import Avatar from "@/components/Avatar";
import * as Icons from "@tabler/icons-react";

import { useMe, usePins } from "@/graphql/Me";
import { useCompany } from "@/graphql/Companies";

export function HomePage() {
  const meData = useMe();
  const pinsData = usePins({ fetchPolicy: "network-only" });
  const companyData = useCompany(window.companyID);

  if (!meData.data || !companyData.data || !pinsData.data) {
    return null;
  }

  const me = meData.data.me;
  const company = companyData.data.company;
  const pins = pinsData.data.pins;

  return (
    <div className="max-w-5xl mx-auto mt-20 flex flex-col gap-8">
      <div className="flex items-center justify-center">
        <input
          type="text"
          className="w-1/2 rounded-lg px-4 py-2 bg-dark-3 block border border-shade-2 placeholder:text-white-2"
          placeholder="Search projects, people, goals..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card colSpan={1} linkTo="/account">
          <div className="flex flex-col items-center justify-center h-full">
            <Avatar size="xxlarge" person={me} />

            <div className="mt-4 text-center">
              <h1 className="text-2xl font-extrabold">{me.fullName}</h1>
              <p className="text-sm">
                {me.title} at {company.name}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 w-full">
              <div className="flex items-center text-sm gap-2">
                <Icons.IconBellFilled size={16} className="text-orange-400" /> Notifications On
              </div>

              <div className="flex items-center text-sm gap-2">
                <Icons.IconBuilding size={16} className="text-sky-400" /> In the office
              </div>
            </div>
          </div>
        </Card>

        <Card colSpan={2} linkTo="/home/my-assignments">
          <h1 className="font-bold flex items-center gap-2">
            <Icons.IconSmartHome size={20} /> My Assignments
          </h1>
          <div className="flex flex-col items-center justify-center h-full -mt-4">
            <Icons.IconSparkles size={20} className="text-yellow-400" />
            <div className="font-medium mt-2 text-sm">Nothing for you today.</div>
          </div>
        </Card>
        <Card colSpan={2}>
          <h1 className="font-bold flex items-center gap-2">
            <Icons.IconFileRss size={20} /> Activity Feed
          </h1>
          <div className="flex flex-col items-center justify-center h-full -mt-4">
            <Icons.IconHelicopter size={20} className="text-pink-400" />
            <div className="font-medium mt-2 text-sm">Waiting for news to arrive.</div>
          </div>
        </Card>
        <Card colSpan={1}>
          <h1 className="font-bold flex items-center gap-2">
            <Icons.IconTableFilled size={20} /> My Projects
          </h1>

          <div className="mt-4">
            <div className="font-bold flex items-center gap-2 bg-dark-5 rounded-lg px-2 py-1.5">
              <div className="text-dark-1 rounded-lg w-10 h-10 flex items-center justify-center bg-pink-400 font-extrabold text-xl">
                S
              </div>

              <div>
                Superpace
                <div className="text-xs font-medium">13 June - 17 July</div>
              </div>
            </div>
          </div>
        </Card>

        {pins.map((pin) => (
          <Card key={pin.id} linkTo={`/projects/${pin.pinned_id}`}>
            <div className="h-full flex flex-col justify-between gap-4">
              <h1 className="font-bold flex items-center gap-2">
                <Icons.IconTableFilled size={20} /> {pin.pinned.name}
              </h1>

              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <CardSectionTitle title="Phase" />
                  <div className="font-bold capitalize">{pin.pinned.phase}</div>
                </div>

                <div>
                  <CardSectionTitle title="Next Milestone" />
                  {pin.pinned.milestones.filter((m) => m.status === "pending").length > 0 ? (
                    <div className="font-bold capitalize">
                      {pin.pinned.milestones.filter((m) => m.status === "pending")[0].title}
                    </div>
                  ) : (
                    <div className="text-white-2">No milestones</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pin.pinned.contributors.map((c) => (
                  <div key={c.id} className="mt-4">
                    <Avatar size="tiny" person={c.person} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-8 flex items-center justify-center text-sm gap-2">
        <div className="font-medium flex items-center gap-2 border border-shade-3 rounded-[20px] px-3 py-1.5 cursor-pointer">
          <Icons.IconGridPattern size={16} />
          Edit Home Page
        </div>

        <div className="font-medium flex items-center gap-2 border border-shade-3 rounded-[20px] px-3 py-1.5 cursor-pointer">
          <Icons.IconArrowUp size={16} /> Back to Top
        </div>
      </div>
    </div>
  );
}

// string interpolation won't work here
// because tailwind removes unused classes
// so we need to use an array
const colSpanOptions = ["col-span-0", "col-span-1", "col-span-2", "col-span-3"];

function Card({ linkTo, children, colSpan = 1 }) {
  return (
    <Link
      to={linkTo}
      className={
        "h-72 rounded-[20px] p-4 hover:scale-[1.01] transition-transform border border-dark-4 cursor-pointer" +
        " " +
        colSpanOptions[colSpan]
      }
      style={{
        background: "linear-gradient(45deg, var(--color-dark-2), var(--color-dark-3))",
      }}
    >
      {children}
    </Link>
  );
}

function CardSectionTitle({ title }) {
  return <div className="font-bold mb-2 text-xs uppercase text-pink-400">{title}</div>;
}
