import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";
import * as React from "react";

import { IconPlus, IconX } from "turboui";

import { PERMISSIONS_LIST, PermissionLevels } from "@/features/Permissions";

import Forms from "@/components/Forms";
import { compareIds, usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { createTestId } from "@/utils/testid";
import { useNavigate } from "react-router-dom";
import { Link, SecondaryButton } from "turboui";

export default { name: "SpaceAddMembersPage", loader, Page } as PageModule;

interface LoaderResult {
  space: Spaces.Space;
}

async function loader({ params }): Promise<LoaderResult> {
  const space = await Spaces.getSpace({ id: params.id });
  return { space: space };
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
  const { space } = Pages.useLoadedData() as LoaderResult;
  const paths = usePaths();
  const backPath = paths.spaceAccessManagementPath(space.id!);
  const navigate = useNavigate();
  const [add] = Spaces.useAddSpaceMembers();

  const form = Forms.useForm({
    fields: {
      members: [newMember()],
    },
    submit: async () => {
      await add({
        spaceId: space.id,
        members: uniqueMemberList(form.values.members),
      });

      navigate(backPath);
    },
  });

  return (
    <Pages.Page title={["Add members", space.name!]}>
      <Paper.Root size="small">
        <Paper.NavigateBack to={backPath} title="Back to Team & Access" />
        <div className="text-2xl font-extrabold mb-4 text-center">Add members to {space.name}</div>
        <p className="text-sm text-center text-content-dimmed mb-4">
          Only existing members can be added.{" "}
          <Link to={paths.invitePeoplePath()} className="text-sm" underline="hover">
            Invite someone new to the organization
          </Link>
        </p>

        <Forms.Form form={form}>
          <Members />

          <Forms.Submit saveText="Add members" layout="centered" buttonSize="base" submitOnEnter={false} />
        </Forms.Form>
      </Paper.Root>
    </Pages.Page>
  );
}

function Members() {
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
          <Member key={c.key} field={`members[${i}]`} search={search} index={i} />
        ))}
      </div>

      <AddMoreMembersButton onClick={addMore} />
    </div>
  );
}

function Member({ field, search, index }) {
  return (
    <div data-test-id={`member-${index}`}>
      <Paper.Body>
        <Forms.FieldGroup layout="horizontal">
          <Forms.SelectPerson field={field + ".personId"} label="Member" searchFn={search} />
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
  const { space } = Pages.useLoadedData() as LoaderResult;

  return React.useCallback(
    async (query: string): Promise<People.Person[]> => {
      const res = await Spaces.searchPotentialSpaceMembers({ groupId: space.id!, query });

      return res.people as People.Person[];
    },
    [space.id],
  );
}

function uniqueMemberList(members: MemberField[]): { id: string; accessLevel: PermissionLevels }[] {
  let res = [] as { id: string; accessLevel: PermissionLevels }[];

  for (const m of members) {
    const existing = res.find((r) => compareIds(r.id, m.personId));

    if (!existing) {
      res.push({ id: m.personId, accessLevel: m.accessLevel });
      continue;
    }

    if (existing.accessLevel < m.accessLevel) {
      existing.accessLevel = m.accessLevel;
    }
  }

  return res;
}
