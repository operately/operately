import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as Spaces from "@/models/spaces";

import { FilledButton } from "@/components/Button";

import { Form, useForm } from "@/features/DiscussionForm";
import { Paths } from "@/routes/paths";

interface LoaderResult {
  space: Spaces.Space;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    space: await Spaces.getSpace({ id: params.spaceId }),
  };
}

export function Page() {
  const { space } = Pages.useLoadedData<LoaderResult>();
  const form = useForm({ space: space, mode: "create" });

  return (
    <Pages.Page title="New Discussion">
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <Form form={form} />
        </Paper.Body>

        <div className="flex justify-center items-center mt-8">
          <FilledButton loading={form.submitting} testId="post-discussion" onClick={form.submit} size="lg">
            {form.submitButtonLabel}
          </FilledButton>
        </div>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spaceDiscussionsPath(space.id)}>
        {React.createElement(Icons[space.icon], { size: 16, className: space.color })}
        {space.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}
