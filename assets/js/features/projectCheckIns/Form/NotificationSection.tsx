import React from "react";

import * as People from "@/models/people";
import * as Projects from "@/models/projects";

import { FormState } from "./useForm";
import { InlinePeopleList } from "@/components/InlinePeopleList";

export function NotificationSection({ form }: { form: FormState }) {
  const regularContributors = form.project.contributors!.filter(
    (contrib) => contrib!.role !== "reviewer" && contrib!.person!.id! !== form.author.id,
  ) as Projects.ProjectContributor[];

  return (
    <div className="mt-10 font-medium">
      <p className="font-bold text-lg">When you submit this check-in:</p>

      <div className="mt-2 gap-2 flex flex-col">
        <WhoWillBeNotified contributors={regularContributors!} />
        <WhoWillNeedToAcknowledge reviewer={form.project.reviewer!} />
      </div>
    </div>
  );
}

function WhoWillNeedToAcknowledge({ reviewer }: { reviewer: People.Person }) {
  if (!reviewer) return null;

  return (
    <div className="inline-flex gap-1 flex-wrap">
      <InlinePeopleList people={[reviewer]} /> will be asked to acknowledge the check-in.
    </div>
  );
}

function WhoWillBeNotified({ contributors }: { contributors: Projects.ProjectContributor[] }) {
  if (!contributors) return null;
  if (contributors.length === 0) return null;

  const people = contributors.map((contrib) => contrib.person!);

  return (
    <div className="inline-flex flex-wrap">
      <InlinePeopleList people={people} /> &nbsp;will be notified.
    </div>
  );
}
