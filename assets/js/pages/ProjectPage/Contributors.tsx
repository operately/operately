import React from "react";

import * as Icons from "tabler-icons-react";
import Avatar from "@/components/Avatar";

function Badge({ title }) {
  return (
    <div className="text-xs uppercase px-1.5 py-0.5 rounded bg-shade-1">
      {title}
    </div>
  );
}

function Champion({ project }) {
  return (
    <div className="border-b border-shade-2 flex items-center justify-between py-3.5 -mx-8 px-6">
      {project.owner ? (
        <div className="flex gap-3 items-center">
          <div className="relative border-2 rounded-full border-yellow-400 p-0.5 -ml-0.5">
            <Avatar person={project.owner} />
          </div>

          <div>
            <div className="font-bold flex gap-2 items-center">
              {project.owner.fullName} <Badge title="champion" />
            </div>
            <div className="text-sm">
              Responsible for achieving results on this project and for
              providing timely updates
            </div>
          </div>
        </div>
      ) : (
        <div></div>
      )}

      <div>
        <div className="hover:text-white-1 text-white-2 cursor-pointer">
          <Icons.DotsVertical size={20} />
        </div>
      </div>
    </div>
  );
}

function Reviwer({ project }) {
  return (
    <div className="border-b border-shade-2 flex items-center justify-between py-3.5 -mx-8 px-6 cursor-pointer">
      {project.owner ? (
        <div className="flex gap-3 items-center">
          <Avatar person={project.contributors[5].person} />
          <div>
            <div className="font-bold flex gap-2 items-center">
              {project.contributors[5].person.fullName}{" "}
              <Badge title="reviwer" />
            </div>
            <div className="text-sm">
              Responsible for reviewing and acknowledging work on this project
            </div>
          </div>
        </div>
      ) : (
        <div></div>
      )}

      <div>
        <div className="hover:text-white-1 text-white-2">
          <Icons.DotsVertical size={20} />
        </div>
      </div>
    </div>
  );
}

function Contributor({ person, responsibility }) {
  return (
    <div className="border-b border-shade-2 flex items-center justify-between py-3.5 -mx-8 px-6">
      <div className="flex gap-3 items-center">
        <Avatar person={person} />

        <div>
          <div className="flex gap-1 items-center">
            <span className="font-bold">{person.fullName}</span>
          </div>
          <div className="text-sm">{responsibility}</div>
        </div>
      </div>

      <div>
        <div className="hover:text-white-1 text-white-2 cursor-pointer">
          <Icons.DotsVertical size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Contributors({ project }) {
  return (
    <div className="fadeIn">
      <Champion project={project} />
      <Reviwer project={project} />

      {project.contributors.map((c, i) => (
        <Contributor
          key={i}
          person={c.person}
          responsibility={c.responsibility}
        />
      ))}
    </div>
  );
}
