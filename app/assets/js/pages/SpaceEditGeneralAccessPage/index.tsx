import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";
import * as React from "react";

import { Forms } from "turboui";
import { useTranslation } from "react-i18next";

import { applyAccessLevelConstraints, initialAccessLevels } from "@/features/spaces";
import { PageModule } from "@/routes/types";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { usePaths } from "@/routes/paths";
export default { name: "SpaceEditGeneralAccessPage", loader, Page } as PageModule;

async function loader({ params }) {
  const queryInput = { id: params.id, includeAccessLevels: true };
  await Api.spaces.getQuery(queryInput);

  return { queryInput };
}

function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.spaces.getQueryOptions(queryInput));
  const space = data?.space;

  if (!space?.id) throw new Error(`Space data is unavailable for space "${queryInput.id}"`);
  if (!space.accessLevels) throw new Error("Space access levels are unavailable");

  return { space: { ...space, accessLevels: space.accessLevels } };
}

function Page() {
  const { t } = useTranslation();
  const { space } = useLoadedData();

  return (
    <Pages.Page title={[t("Edit General Access"), space.name]}>
      <Paper.Root size="small">
        <Paper.Body>
          <h1 className="text-2xl font-extrabold">{t("Edit General Access")}</h1>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const paths = usePaths();
  const { space } = useLoadedData();

  const navigateBack = useNavigateTo(paths.spaceAccessManagementPath(space.id));
  const { mutateAsync: edit } = Spaces.useEditSpacePermissions();

  const form = Forms.useForm({
    fields: {
      access: initialAccessLevels(space.accessLevels),
    },
    onChange: ({ newValues }) => {
      newValues.access = applyAccessLevelConstraints(newValues.access);
    },
    submit: async () => {
      await edit({
        spaceId: space.id,
        accessLevels: {
          __typename: "access_levels",
          public: form.values.access.anonymous,
          company: form.values.access.companyMembers,
        },
      });

      navigateBack();
    },
    cancel: navigateBack,
  });

  return (
    <Forms.Form form={form}>
      <Forms.AccessSelectors showSpaceAccess={false} />
      <Forms.Submit />
    </Forms.Form>
  );
}
