import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";
import * as React from "react";

import { Forms, IconPlus, IconX, Link, SecondaryButton } from "turboui";
import { useTranslation } from "react-i18next";
import { translationText } from "@/i18n";

import { permissionsList, PermissionLevels } from "@/features/Permissions";

import { compareIds, usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { createTestId } from "@/utils/testid";
import { useNavigate } from "react-router";

export default { name: "SpaceAddMembersPage", loader, Page } as PageModule;

async function loader({ params }) {
  const queryInput = { id: params.id };
  await Api.spaces.getQuery(queryInput);

  return { queryInput };
}

function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.spaces.getQueryOptions(queryInput));
  const space = data?.space;

  if (!space?.id) throw new Error(`Space data is unavailable for space "${queryInput.id}"`);

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
  const { t } = useTranslation();
  const paths = usePaths();
  const navigate = useNavigate();

  const { space } = useLoadedData();
  const backPath = paths.spaceAccessManagementPath(space.id);
  const { mutateAsync: add } = Spaces.useAddSpaceMembers();

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
    <Pages.Page title={[translationText(t("Add members")), space.name]}>
      <Paper.Root size="small">
        <Paper.NavigateBack to={backPath} title={t("Back to Team & Access")} />
        <div className="text-2xl font-extrabold mb-4 text-center">
          {t("Add members to {{name}}", { name: space.name })}
        </div>
        <p className="text-sm text-center text-content-dimmed mb-4">
          {t("Only existing members can be added.")}{" "}
          <Link to={paths.invitePeoplePath()} className="text-sm" underline="hover">
            {t("Invite someone new to the organization")}
          </Link>
        </p>

        <Forms.Form form={form}>
          <Members />

          <Forms.Submit
            saveText={translationText(t("Add members"))}
            layout="centered"
            buttonSize="base"
            submitOnEnter={false}
          />
        </Forms.Form>
      </Paper.Root>
    </Pages.Page>
  );
}

function Members() {
  const search = useSearch();

  const [members = []] = Forms.useFieldValue<MemberField[]>("members");
  const [value = [], setValue] = Forms.useFieldValue<MemberField[]>("members");

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
  const { t } = useTranslation();

  return (
    <div data-test-id={`member-${index}`}>
      <Paper.Body>
        <Forms.FieldGroup layout="horizontal">
          <Forms.SelectPerson field={field + ".personId"} label={translationText(t("Member"))} searchFn={search} />
          <Forms.SelectBox
            field={field + ".accessLevel"}
            label={translationText(t("Access Level"))}
            options={permissionsList()}
          />
        </Forms.FieldGroup>

        <RemoveMemberButton index={index} />
      </Paper.Body>
    </div>
  );
}

function AddMoreMembersButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center" style={{ marginTop: "-18px" }} data-test-id={createTestId("add-more")}>
      <SecondaryButton onClick={onClick} ariaLabel={translationText(t("Add another member"))}>
        <IconPlus size={16} />
      </SecondaryButton>
    </div>
  );
}

function RemoveMemberButton({ index }) {
  const { t } = useTranslation();
  const [value = [], setValue] = Forms.useFieldValue<MemberField[]>("members");

  const onClick = () => {
    const newValue = value.filter((_, i) => i !== index);
    setValue(newValue);
  };

  if (index === 0) return null;

  return (
    <div className="absolute" style={{ top: "-14px", right: "-14px" }}>
      <SecondaryButton
        ariaLabel={translationText(t("Remove member"))}
        className="!rounded-full !p-2 !text-content-subtle hover:!text-content-accent hover:!bg-surface-base"
        onClick={onClick}
      >
        <IconX size={16} />
      </SecondaryButton>
    </div>
  );
}

function useSearch() {
  const { space } = useLoadedData();

  return Spaces.usePotentialSpaceMembersSearch(space.id);
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
