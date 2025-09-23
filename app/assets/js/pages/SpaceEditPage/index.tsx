import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";
import * as React from "react";
import * as Api from "@/api";

import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router-dom";

import Forms from "@/components/Forms";

import { usePaths } from "@/routes/paths";
import { showErrorToast, showSuccessToast } from "@/features/toasts";
export default { name: "SpaceEditPage", loader, Page } as PageModule;

interface LoaderResult {
  space: Spaces.Space;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    space: await Spaces.getSpace({ id: params.id }),
  };
}

function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const { space } = Pages.useLoadedData<LoaderResult>();

  const [edit] = Spaces.useEditSpace();
  const backPath = paths.spacePath(space.id!);

  const form = Forms.useForm({
    fields: {
      name: space.name || "",
      purpose: space.mission || "",
    },
    submit: async () => {
      await edit({
        id: space.id!,
        name: form.values.name,
        mission: form.values.purpose,
      });

      navigate(backPath);
    },
    cancel: () => navigate(backPath),
  });

  const deleteSpace = async () => {
    if (!window.confirm(`Are you sure you want to delete "${space.name}"? This action cannot be undone and will delete all projects, goals, and other content in this space.`)) {
      return;
    }

    try {
      await Api.deleteSpace({ spaceId: space.id! });
      showSuccessToast("Space deleted", `${space.name} has been deleted successfully.`);
      navigate(paths.companyHomePath());
    } catch (error) {
      console.error("Failed to delete space:", error);
      showErrorToast("Failed to delete space", "Please try again. If the problem persists, contact support.");
    }
  };

  return (
    <Pages.Page title={["Edit Space", space.name!]}>
      <Paper.Root size="small">
        <Paper.Body minHeight="none">
          <Forms.Form form={form}>
            <div className="font-extrabold text-2xl text-center mb-4">Editing {space.name}</div>
            <Forms.FieldGroup layout="vertical">
              <Forms.TextInput label="Name" field={"name"} />
              <Forms.TextInput label="Purpose" field={"purpose"} />
            </Forms.FieldGroup>
            <Forms.Submit saveText="Save" />
          </Forms.Form>

          {space.permissions?.canDelete && (
            <div className="mt-8 pt-8 border-t border-stroke-base">
              <div className="font-semibold text-lg mb-4 text-content-error">Danger Zone</div>
              <div className="bg-surface-dimmed p-4 rounded border border-stroke-base">
                <div className="font-medium mb-2">Delete this space</div>
                <div className="text-content-dimmed text-sm mb-4">
                  Once you delete a space, there is no going back. All projects, goals, discussions, and other content will be permanently deleted.
                </div>
                <button
                  onClick={deleteSpace}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete Space
                </button>
              </div>
            </div>
          )}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
