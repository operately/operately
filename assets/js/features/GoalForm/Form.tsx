import React from "react";

import classnames from "classnames";
import PeopleSearch from "@/components/PeopleSearch";

import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";
import * as People from "@/graphql/People";
import * as TipTapEditor from "@/components/Editor";
import * as Icons from "@tabler/icons-react";
import * as Goals from "@/models/goals";
import * as Groups from "@/models/groups";

import { GhostButton } from "@/components/Button";
import { AddTarget, Target, TargetHeader } from "./Target";
import { FormState } from "./useForm";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

export function Form({ form }: { form: FormState }) {
  return (
    <Forms.Form onSubmit={form.submit} loading={form.submitting} onCancel={form.cancel} isValid={true}>
      <FormMain form={form} />
      <FormFooter form={form} />
    </Forms.Form>
  );
}

function FormMain({ form }: { form: FormState }) {
  const placeholders = [["e.g. Avarage Onboarding Time is twice as fast", "30", "15", "minutes"]];

  return (
    <div className="font-medium">
      <GoalHeader form={form} />

      <div className="mb-12 text-lg">
        <GoalName form={form} />
        <AddDescription form={form} />
      </div>

      <Description form={form} />

      {form.config.mode === "create" ? (
        <div className="font-bold text-lg">Success Conditions</div>
      ) : (
        <div className="font-bold">Success Conditions</div>
      )}

      <div className="mt-1 text-sm text-content-dimmed">How will you know that you succeded?</div>
      {form.errors.find((e) => e.field === "targets") && (
        <div className="text-red-500 text-sm">At least one success condition is required</div>
      )}

      <div className="mt-4">
        <TargetHeader />
        {form.fields.targets.map((target, index) => (
          <Target key={index} form={form} index={index} target={target} placeholders={placeholders[index] || []} />
        ))}
        <AddTarget form={form} />
      </div>
    </div>
  );
}

function Description({ form }: { form: FormState }) {
  if (!form.fields.hasDescription) return null;

  return (
    <div className="mb-12">
      <div className="font-bold text-lg">Description</div>
      <div className="text-sm text-content-dimmed mb-2">Add more context to your goal (optional)</div>

      <TipTapEditor.Root editor={form.fields.descriptionEditor}>
        <div className="border-x border-b border-stroke-base flex-1">
          <TipTapEditor.Toolbar editor={form.fields.descriptionEditor} />
          <TipTapEditor.EditorContent editor={form.fields.descriptionEditor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}

function FormFooter({ form }: { form: FormState }) {
  const bottomGridStyle = classnames({
    "grid grid-cols-1 sm:grid-cols-2 gap-4": true,
    "lg:grid-cols-3": !form.config.allowSpaceSelection,
    "lg:grid-cols-4": form.config.allowSpaceSelection,
  });

  return (
    <Paper.DimmedSection>
      <div className={bottomGridStyle}>
        {form.config.allowSpaceSelection && (
          <div className="basis-1/4">
            <SpaceSelector form={form} />
          </div>
        )}

        <div>
          <ContributorSearch
            title="Champion"
            onSelect={form.fields.setChampion}
            defaultValue={form.fields.champion}
            error={form.errors.find((e) => e.field === "champion")}
            inputId="champion-search"
          />
        </div>

        <div>
          <ContributorSearch
            title="Reviewer"
            onSelect={form.fields.setReviewer}
            defaultValue={form.fields.reviewer}
            inputId="reviewer-search"
            error={form.errors.find((e) => e.field === "reviewer")}
          />
        </div>

        <div>
          <TimeframeSelector form={form} />
        </div>
      </div>
    </Paper.DimmedSection>
  );
}

function GoalName({ form }: { form: FormState }) {
  const className = classnames(
    "border-b border-surface-outline",
    "px-0 py-1",
    "w-full",
    "placeholder:text-content-subtle",
    "focus:bg-surface-highlight bg-transparent",
    {
      "bg-red-400/10": form.errors.find((e) => e.field === "name"),
    },
  );

  return (
    <input
      autoFocus
      className={className}
      placeholder="e.g. Improve product onboarding"
      value={form.fields.name}
      onChange={(e) => form.fields.setName(e.target.value)}
      data-test-id="goal-name"
    />
  );
}

function SpaceSelector({ form }: { form: FormState }) {
  const hasError = !!form.errors.find((e) => e.field === "space");

  return (
    <Forms.SelectBox
      label="Space"
      value={form.fields.space}
      onChange={form.fields.setSpace}
      options={form.fields.spaceOptions}
      defaultValue={null}
      error={hasError}
    />
  );
}

function TimeframeSelector({ form }: { form: FormState }) {
  return (
    <Forms.SelectBox
      label="Timeframe"
      value={form.fields.timeframe}
      onChange={form.fields.setTimeframe}
      options={form.fields.timeframeOptions}
      defaultValue={form.fields.timeframeOptions[0]}
    />
  );
}

function ContributorSearch({ title, onSelect, defaultValue, inputId, error }: any) {
  const loader = People.usePeopleSearch();

  return (
    <div>
      <label className="font-semibold block mb-1">{title}</label>
      <div className="flex-1">
        <PeopleSearch
          onChange={(option) => onSelect(option?.person)}
          defaultValue={defaultValue}
          placeholder="Search for person..."
          inputId={inputId}
          loader={loader}
          error={!!error}
        />
      </div>
    </div>
  );
}

function AddDescription({ form }: { form: FormState }) {
  if (form.fields.hasDescription) return null;

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <GhostButton size="xxs" type="secondary" onClick={form.fields.setHasDescription}>
        Add Description
      </GhostButton>
    </div>
  );
}

function ParentGoal({ form }: { form: FormState }) {
  if (form.config.parentGoal) {
    const goal = form.config.parentGoal as Goals.Goal;

    return (
      <div>
        <div className="flex items-center">
          <Icons.IconTarget size={14} className="text-red-500" />
          <DivLink to={Paths.goalPath(goal.id)} className="hover:underline font-medium ml-1" testId="parent-goal-link">
            {goal.name}
          </DivLink>
        </div>
        <div className="ml-1 border-l h-4 border-surface-outline" />
      </div>
    );
  } else if (!form.config.allowSpaceSelection) {
    const space = form.config.space as Groups.Group;

    return (
      <div>
        <div className="flex items-center text-sm gap-1">
          <Icons.IconBuildingEstate size={14} className="text-blue-500" />
          Company-wide goal for {space.name}
        </div>
        <div className="ml-1 border-l h-2 border-surface-outline" />
      </div>
    );
  } else {
    return (
      <div>
        <div className="flex items-center text-sm gap-1">
          <Icons.IconBuildingEstate size={14} className="text-blue-500" />
          Company-wide
        </div>
        <div className="ml-1 border-l h-2 border-surface-outline" />
      </div>
    );
  }
}

function GoalHeader({ form }: { form: FormState }) {
  if (form.config.mode === "create") {
    return (
      <>
        <ParentGoal form={form} />
        <div className="font-bold text-lg mb-3">{form.config.parentGoal ? "Subgoal Name" : "Goal"}</div>
      </>
    );
  } else {
    return <div className="font-bold">Name</div>;
  }
}
