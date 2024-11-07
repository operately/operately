import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";

import { PrimaryButton } from "@/components/Buttons";
import { Form, useForm } from "@/features/DiscussionForm";
import { Paths } from "@/routes/paths";

interface LoaderResult {
  space: Spaces.Space;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    space: await Spaces.getSpace({
      id: params.id,
      includePotentialSubscribers: true,
    }),
  };
}

export function Page() {
  const { space } = Pages.useLoadedData<LoaderResult>();
  const form = useForm({ space: space, mode: "create", potentialSubscribers: space.potentialSubscribers! });

  return (
    <Pages.Page title="New Discussion">
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <Form form={form} />
        </Paper.Body>

        <div className="flex justify-center items-center mt-8">
          <PrimaryButton loading={form.submitting} testId="post-discussion" onClick={form.submit} size="lg">
            {form.submitButtonLabel}
          </PrimaryButton>
        </div>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spaceDiscussionsPath(space.id)}>{space.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
