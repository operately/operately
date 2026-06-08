import React from "react";

import Api, { InviteLink } from "@/api";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { redirect } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "turboui";

export default { name: "InviteLinkFullPage", loader, Page } as PageModule;

interface LoaderResult {
  invite: InviteLink | null;
  token: string;
}

async function loader({ params }): Promise<LoaderResult | Response> {
  const token = params.token;

  if (!token) {
    return redirect("/");
  }

  try {
    const result = await Api.invitations.getInviteLinkAvailability({ token });

    if (!result.memberLimitExceeded) {
      return redirect(Paths.inviteJoinPath(token));
    }

    return { invite: result.inviteLink || null, token };
  } catch {
    return redirect(Paths.inviteJoinPath(token));
  }
}

function Page() {
  const { invite, token } = Pages.useLoadedData<LoaderResult>();
  const companyName = invite?.company?.name;

  return (
    <Pages.Page title={["Company Full"]} testId="invite-link-full-page">
      <Paper.Root size="small">
        <Paper.Body noPadding className="h-dvh overflow-hidden sm:h-auto">
          <Hero companyName={companyName} />

          <div className="px-8 py-8 sm:px-10 sm:py-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <NextStepCard
                eyebrow="What happens now"
                title="An admin or owner needs to help"
                description="An admin or owner needs to review billing or free up member space before anyone else can join."
              />
              <NextStepCard
                eyebrow="What you can do"
                title="Try again later"
                description="Once the upgrade is done, come back to this link and try again."
              />
            </div>

            <div className="mt-8 border-t border-stroke-base pt-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <PrimaryButton linkTo={Paths.inviteJoinPath(token)} testId="retry-join">
                  Try again
                </PrimaryButton>
                <SecondaryButton linkTo="/" testId="back-to-home">
                  Back to home
                </SecondaryButton>
              </div>
            </div>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Hero({ companyName }: { companyName?: string | null }) {
  return (
    <div className="border-b border-stroke-base px-8 py-8 sm:px-10 sm:py-10">
      <h1 className="max-w-xl text-3xl font-extrabold leading-tight text-content-accent sm:text-4xl">Member limit reached</h1>

      <p className="mt-4 max-w-2xl text-base leading-7 text-content-accent">
        {companyName ? (
          <>
            <span className="font-semibold">{companyName}</span> has reached its member limit, so this invite can't be used yet.
          </>
        ) : (
          <>This company has reached its member limit, so this invite can't be used yet.</>
        )}{" "}
        When more member capacity is available, you can come back and try again.
      </p>
    </div>
  );
}

function NextStepCard(props: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-stroke-base bg-surface-dimmed p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-content-dimmed">{props.eyebrow}</div>
      <div className="mt-2 text-base font-semibold text-content-accent">{props.title}</div>
      <p className="mt-2 text-sm leading-6 text-content-dimmed">{props.description}</p>
    </div>
  );
}
