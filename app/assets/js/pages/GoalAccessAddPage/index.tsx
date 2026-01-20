import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Goals from "@/models/goals";
import * as React from "react";

import Api from "@/api";
import { IconPlus, IconX, SecondaryButton } from "turboui";
import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";

import Forms from "@/components/Forms";
import { compareIds, usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { createTestId } from "@/utils/testid";
import { useNavigate } from "react-router-dom";

export default { name: "GoalAccessAddPage", loader, Page } as PageModule;

interface LoaderResult {
  goal: Goals.Goal;
  accessMembers: People.Person[];
}

async function loader({ params }): Promise<LoaderResult> {
  const [goal, accessMembers] = await Promise.all([
    Goals.getGoal({
      id: params.goalId,
      includeChampion: true,
      includeReviewer: true,
    }).then((res) => res.goal),
    Api.goals.listAccessMembers({ goalId: params.goalId }).then((res) => res.people ?? []),
  ])

  return { goal, accessMembers };
}

interface MemberField {
  key: number;
  personId: string;
  accessLevel: PermissionLevels;
}

function newMember() {
  return {
    key: Math.random(),
    personId: "",
    accessLevel: PermissionLevels.EDIT_ACCESS,
  };
}

function Page() {
  const { goal, accessMembers } = Pages.useLoadedData<LoaderResult>();
  const paths = usePaths();
  const goalName = goal.name ?? "Goal";
  const backPath = paths.goalAccessManagementPath(goal.id);
  const navigate = useNavigate();
  const [add] = Api.goals.useAddAccessMembers();

  const form = Forms.useForm({
    fields: {
      members: [newMember()],
    },
    submit: async () => {
      await add({
        goalId: goal.id,
        members: uniqueMemberList(form.values.members, accessMembers),
      });

      navigate(backPath);
    },
  });

  return (
    <Pages.Page title={["Add people", goalName]} testId="goal-access-add-page">
      <Paper.Root size="small">
        <Paper.NavigateBack to={backPath} title="Back to Team & Access" />
        <div className="text-2xl font-extrabold mb-4 text-center">Add people to {goalName}</div>

        <Forms.Form form={form}>
          <Members accessMembers={accessMembers} />

          <Forms.Submit saveText="Add people" layout="centered" buttonSize="base" submitOnEnter={false} />
        </Forms.Form>
      </Paper.Root>
    </Pages.Page>
  );
}

function Members({ accessMembers }: { accessMembers: People.Person[] }) {
  const search = useSearch();
  const [members] = Forms.useFieldValue<MemberField[]>("members");
  const [value, setValue] = Forms.useFieldValue<MemberField[]>("members");

  const addMore = React.useCallback(() => {
    setValue([...value, newMember()]);
  }, [value, setValue]);

  return (
    <div>
      <div className="flex flex-col gap-6">
        {members.map((c, i) => (
          <Member key={c.key} field={`members[${i}]`} search={search} index={i} exclude={accessMembers} />
        ))}
      </div>

      <AddMoreMembersButton onClick={addMore} />
    </div>
  );
}

function Member({
  field,
  search,
  index,
  exclude,
}: {
  field: string;
  search: (query: string) => Promise<People.Person[]>;
  index: number;
  exclude: People.Person[];
}) {
  return (
    <div data-test-id={`member-${index}`}>
      <Paper.Body>
        <Forms.FieldGroup layout="horizontal">
          <Forms.SelectPerson field={field + ".personId"} label="Person" searchFn={search} exclude={exclude} />
          <Forms.SelectBox field={field + ".accessLevel"} label="Access Level" options={PERMISSIONS_LIST} />
        </Forms.FieldGroup>

        <RemoveMemberButton index={index} />
      </Paper.Body>
    </div>
  );
}

function AddMoreMembersButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center" style={{ marginTop: "-18px" }} data-test-id={createTestId("add-more")}>
      <SecondaryButton onClick={onClick}>
        <IconPlus size={16} />
      </SecondaryButton>
    </div>
  );
}

function RemoveMemberButton({ index }) {
  const [value, setValue] = Forms.useFieldValue<MemberField[]>("members");

  const onClick = () => {
    const newValue = value.filter((_, i) => i !== index);
    setValue(newValue);
  };

  if (index === 0) return null;

  return (
    <div className="absolute" style={{ top: "-14px", right: "-14px" }}>
      <div
        className="border border-surface-outline rounded-full p-2 cursor-pointer text-content-subtle hover:text-content-accent bg-surface-base"
        onClick={onClick}
      >
        <IconX size={16} />
      </div>
    </div>
  );
}

function useSearch() {
  const search = People.usePeopleSearch(People.CompanyWideSearchScope);

  return React.useCallback((query: string) => search(query), [search]);
}

function uniqueMemberList(members: MemberField[], excluded: People.Person[]): { id: string; accessLevel: PermissionLevels }[] {
  const excludedIds = excluded.flatMap((person) => (person.id ? [person.id] : []));
  let res = [] as { id: string; accessLevel: PermissionLevels }[];

  for (const member of members) {
    if (!member.personId) continue;
    if (excludedIds.some((id) => compareIds(id, member.personId))) continue;

    const existing = res.find((r) => compareIds(r.id, member.personId));

    if (!existing) {
      res.push({ id: member.personId, accessLevel: member.accessLevel });
      continue;
    }

    if (existing.accessLevel < member.accessLevel) {
      existing.accessLevel = member.accessLevel;
    }
  }

  return res;
}
