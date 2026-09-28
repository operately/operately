import React from "react";
import { Trans, useTranslation } from "react-i18next";

import { loader, useLoadedData } from "./loader";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { translationText } from "@/i18n";
import { Paths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { PrimaryButton, SecondaryButton } from "turboui";

export default { name: "InviteLinkFullPage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const { invite, token } = useLoadedData();
  const companyName = invite?.company?.name;

  return (
    <Pages.Page title={translationText(t("Company Full"))} testId="invite-link-full-page">
      <Paper.Root size="small">
        <Paper.Body noPadding className="h-dvh overflow-hidden sm:h-auto">
          <Hero companyName={companyName} />

          <div className="px-8 py-8 sm:px-10 sm:py-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <NextStepCard
                eyebrow={t("What happens now")}
                title={t("An admin or owner needs to help")}
                description={t(
                  "An admin or owner needs to review billing or free up member space before anyone else can join.",
                )}
              />
              <NextStepCard
                eyebrow={t("What you can do")}
                title={t("Try again later")}
                description={t("Once the upgrade is done, come back to this link and try again.")}
              />
            </div>

            <div className="mt-8 border-t border-stroke-base pt-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <PrimaryButton linkTo={Paths.inviteJoinPath(token)} testId="retry-join">
                  {t("Try again")}
                </PrimaryButton>
                <SecondaryButton linkTo="/" testId="back-to-home">
                  {t("Back to home")}
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
  const { t } = useTranslation();

  return (
    <div className="border-b border-stroke-base px-8 py-8 sm:px-10 sm:py-10">
      <h1 className="max-w-xl text-3xl font-extrabold leading-tight text-content-accent sm:text-4xl">
        {t("Member limit reached")}
      </h1>

      <p className="mt-4 max-w-2xl text-base leading-7 text-content-accent">
        {companyName ? (
          <Trans
            i18nKey="<company>{{companyName}}</company> has reached its member limit, so this invite can't be used yet. When more member capacity is available, you can come back and try again."
            values={{ companyName }}
            components={{ company: <span className="font-semibold" /> }}
          />
        ) : (
          t(
            "This company has reached its member limit, so this invite can't be used yet. When more member capacity is available, you can come back and try again.",
          )
        )}
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
