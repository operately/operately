import React from "react";

import { Cross1Icon, ShuffleIcon } from "@radix-ui/react-icons";

import Icon from "@/components/Icon";
import Avatar from "@/components/Avatar";

function ChampionBadge() {
  return (
    <div className="text-xs uppercase bg-brand-base px-1 py-0.5 rounded">
      Champion
    </div>
  );
}

export default function Contributors({ data }) {
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

        {data.project.contributors.map((c, i) => (
          <div
            key={i}
            className="border-t border-b border-gray-700 flex items-center justify-between py-4"
          >
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
