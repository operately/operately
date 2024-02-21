import React from "react";

import classNames from "classnames";
import Avatar from "@/components/Avatar";

import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";
import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";

import { FormState } from "./useForm";
import { FilledButton } from "@/components/Button";

interface FormProps {
  form: FormState;
  noSubmitActions?: boolean;
  project: Projects.Project;
}

export function Form({ form, noSubmitActions }: FormProps) {
  return (
    <>
      <Header />
      <StatusForm form={form} />
      <TextForm form={form} />

      {noSubmitActions && <SubmitActions form={form} />}
    </>
  );
}

function SubmitActions({ form }: { form: FormState }) {
  const regularContributors = form.project.contributors!.filter(
    (contrib) => contrib!.role !== "reviewer" && contrib!.person.id !== form.author.id,
  );

  return (
    <div className="mt-10">
      <p className="font-bold text-lg">When you submit this check-in:</p>

      <ul className="">
        {regularContributors.length > 0 && (
          <li>
            <div className="flex items-center gap-1.5 mt-2 font-medium">
              <div className="flex items-center gap-1.5 font-medium">
                {regularContributors.map((contrib, i) => (
                  <div className="flex items-center" key={contrib!.id}>
                    <div className="flex items-center gap-1 font-medium flex-wrap">
                      <Avatar person={contrib!.person!} size={18} />
                      {People.firstName(contrib!.person!)}
                    </div>
                    {i < regularContributors.length - 1 &&
                      (i === regularContributors.length - 2 ? <span className="ml-1"> and </span> : <span>, </span>)}
                  </div>
                ))}
              </div>

              <div>will be notified.</div>
            </div>
          </li>
        )}

        {form.project.reviewer && (
          <li>
            <div className="flex items-center gap-1.5 mt-2">
              <p className="font-medium">The project reviewer</p>

              <div className="flex items-center gap-1.5 font-medium">
                <Avatar person={form.project.reviewer!} size={18} /> {form.project.reviewer?.fullName} will be asked to
                acknowledge the check-in.
              </div>
            </div>
          </li>
        )}
      </ul>

      <div className="flex items-center gap-2 mt-4">
        <FilledButton onClick={form.submit} testId="post-check-in" bzzzOnClickFailure>
          {form.submitButtonLabel}
        </FilledButton>

        <FilledButton type="secondary" linkTo={form.cancelPath} data-test-id="cancel">
          Cancel
        </FilledButton>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="text-2xl font-bold mx-auto">Weekly Check-in</div>
      <div>Asking the champion to provide a weekly update on the project's progress.</div>
    </div>
  );
}

function TextForm({ form }: { form: FormState }) {
  return (
    <>
      <div className="text-lg font-bold mx-auto">2. What's new since the last check-in?</div>
      <div className="mt-2 border-x border-stroke-base">
        <TipTapEditor.StandardEditorForm editor={form.editor.editor} minHeight={100} />
      </div>
    </>
  );
}
function StatusForm({ form }: { form: FormState }) {
  const project = form.project;
  const reviewer = project.reviewer;

  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">1. How's the project going?</div>

      <div className="flex flex-col gap-2 mt-2">
        <StatusOption form={form} status="on_track" title="On Track">
          Work is progressing as planned.
          <br />
          No involvement by {reviewer ? People.firstName(reviewer!) : "the reviewer"} is needed at this time.
        </StatusOption>
      </div>
    </div>
  );
}
// <StatusOption form={form} status="caution" title="Caution">
//   A potential problem may exist, perhaps in the future, if not monitored.
//   <br />
//   {reviewer ? People.firstName(reviewer!) : "the reviewer"} should be aware, but no action is needed.
// </StatusOption>

// <StatusOption form={form} status="issue" title="Issue">
//   There’s a problem that may significantly affect time, cost, quality, or scope.
//   <br />
//   {reviewer ? People.firstName(reviewer!) + "'s" : "The reviewer's"} involvement is necessary.
// </StatusOption>

function StatusOption({
  form,
  status,
  title,
  children,
}: {
  form: FormState;
  status: string;
  title: string;
  children: React.ReactNode;
}) {
  const color = status === "on_track" ? "green" : status === "caution" ? "yellow" : "red";
  const active = form.status === status;

  return (
    <div className={"flex justify-between items-center border border-stroke-base p-4"}>
      <div className="flex items-center gap-4">
        <Circle color={color} active={active} onClick={() => form.setStatus(status)} />

        <div>
          <p className="font-bold">{title}</p>
          <div className="text-sm">{children}</div>
        </div>
      </div>
      <div>
        <Icons.IconChevronDown size={24} />
      </div>
    </div>
  );
}

const CIRCLE_BORDER_COLORS = {
  green: "border-green-600",
  yellow: "border-yellow-400",
  red: "border-red-500",
};

const CIRCLE_HOVER_BORDER_COLORS = {
  green: "hover:border-green-600",
  yellow: "hover:border-yellow-400",
  red: "hover:border-red-500",
};

const CIRCLE_BACKGROUND_COLORS = {
  green: "bg-green-600",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
};

function Circle({
  color,
  active,
  onClick,
}: {
  color: "green" | "yellow" | "red";
  active?: boolean;
  onClick: () => void;
}) {
  const borderColor = CIRCLE_BORDER_COLORS[color];
  const backgroundColor = CIRCLE_BACKGROUND_COLORS[color];
  const hoverBorderColor = CIRCLE_HOVER_BORDER_COLORS[color];

  let className = classNames(
    "w-10 h-10",
    "rounded-full",
    "flex items-center justify-center",
    "border-2",
    "p-0.5",
    "cursor-pointer",
    "transition-all",
  );

  if (active) {
    className = classNames(className, borderColor);
  } else {
    className = classNames(className, "border-stroke-base", "opacity-70", "hover:opacity-100", hoverBorderColor);
  }

  return (
    <div className={className} onClick={onClick}>
      <div className={backgroundColor + " " + "w-full h-full rounded-full"}></div>
    </div>
  );
}
