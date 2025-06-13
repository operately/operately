import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";
import * as React from "react";

import Forms from "@/components/Forms";

import { AccessSelectors, applyAccessLevelConstraints, initialAccessLevels } from "@/features/spaces";
import { PageModule } from "@/routes/types";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { usePaths } from "@/routes/paths";
export default { name: "SpaceEditGeneralAccessPage", loader, Page } as PageModule;

interface LoaderResult {
  space: Spaces.Space;
}

async function loader({ params }): Promise<LoaderResult> {
  const space = await Spaces.getSpace({ id: params.id, includeAccessLevels: true });

  return { space: space };
}

function Page() {
  const { space } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={["Edit General Access", space.name!]}>
      <Paper.Root size="small">
        <Paper.Body>
          <h1 className="text-2xl font-extrabold">Edit General Access</h1>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const paths = usePaths();
  const { space } = Pages.useLoadedData();

  const navigateBack = useNavigateTo(paths.spaceAccessManagementPath(space.id!));
  const [edit] = Spaces.useEditSpacePermissions();

  const form = Forms.useForm({
    fields: {
      access: initialAccessLevels(space.accessLevels),
    },
    onChange: ({ newValues }) => {
      newValues.access = applyAccessLevelConstraints(newValues.access);
    },
    submit: async () => {
      await edit({
        spaceId: space.id!,
        accessLevels: {
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
      <AccessSelectors />
      <Forms.Submit />
    </Forms.Form>
  );
}
