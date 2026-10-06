import { useTranslation } from "react-i18next";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as AdminApi from "@/ee/admin_api";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { FeatureFlagsSection } from "./FeatureFlagsSection";

import { Avatar, SecondaryButton, FormattedTime, formatStorageBytes } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

import { useStartSupportSession } from "@/features/SupportSessions";
import { useLoadedData } from "./loader";

export { loader } from "./loader";

export function Page() {
  const { t } = useTranslation();
  const { company, companyId, availableFeatures } = useLoadedData();
  const { startSupportSession, supportSessionStarting } = useStartSupportSession(companyId);

  return (
    <Pages.Page title={t("Admininstration")} testId="saas-admin-page">
      <Paper.Root size="large">
        <Paper.Navigation items={[{ to: "/admin", label: t("All Companies") }]} />

        <Paper.Body>
          <div className="text-3xl font-semibold">{company.name}</div>
          <OwnersSection company={company} />

          <h2 className="mt-8 font-bold">{t("Stats")}</h2>
          <StatsSection company={company} />

          <h2 className="mt-8 font-bold">{t("Information")}</h2>
          <Info company={company} />

          <FeatureFlagsSection
            companyId={companyId}
            availableFeatures={availableFeatures}
            enabledFeatures={company.enabledFeatures ?? []}
          />

          <h2 className="mt-8 font-bold">{t("Support Mode")}</h2>
          <p className="text-sm text-content-accent mb-3 mt-1 max-w-lg">
            {t(
              "Temporarily enable elevated support access for troubleshooting issues with this company's account. You will view the account as if you were an owner.",
            )}
          </p>

          <SecondaryButton
            size="xs"
            onClick={startSupportSession}
            loading={supportSessionStarting}
            testId="start-support-session"
          >
            {t("Start Support Session")}
          </SecondaryButton>

          <h2 className="mt-8 font-bold">{t("Activity")}</h2>
          <ActivitySection companyId={companyId} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Info({ company }: { company: AdminApi.Company }) {
  const { t } = useTranslation();
  return (
    <div className="border-y border-stroke-base py-3 px-1 mt-2 text-sm flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="font-medium w-40">{t("Short ID")}</div>
        <div className="text-blue-500">
          <code>{company.shortId}</code>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="font-medium w-40">{t("Database ID")}</div>
        <div className="text-blue-500">
          <code>{company.uuid}</code>
        </div>
      </div>
    </div>
  );
}

function StatsSection({ company }: { company: AdminApi.Company }) {
  const { t } = useTranslation();
  return (
    <div className="border-y border-stroke-base py-3 mt-2">
      <div className="grid grid-cols-5 gap-4 w-full">
        <Stat title={t("People")} value={company.peopleCount ?? 0} />
        <Stat title={t("Spaces")} value={company.spacesCount ?? 0} />
        <Stat title={t("Goals")} value={company.goalsCount ?? 0} />
        <Stat title={t("Projects")} value={company.projectsCount ?? 0} />
        <Stat title={t("Storage")} value={formatStorageBytes(company.storageUsageBytes)} />
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number | string | React.ReactNode }) {
  return (
    <div className="not-first:border-l border-stroke-base px-4">
      <div className="uppercase text-xs font-semibold mb-1 text-center text-content-dimmed">{title}</div>
      <div className="text-content-accent text-center text-xl">{value}</div>
    </div>
  );
}

function OwnersSection({ company }: { company: AdminApi.Company }) {
  const owners = company.owners ?? [];

  return (
    <div className="flex gap-12 mt-8">
      {owners.map((owner) => (
        <div key={owner.id} className="flex items-center gap-3">
          <Avatar size={54} person={owner} />
          <div>
            <div className="text-[10px] font-bold uppercase text-content-dimmed">{owner.title}</div>
            <div className="font-semibold">{owner.fullName}</div>
            <div className="text-sm text-content-accent">{owner.email}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivitySection({ companyId }: { companyId: string }) {
  const { t } = useTranslation();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { data } = useQuery(AdminApi.getActivitiesQueryOptions({ companyId }));

  if (!data || !data.activities) return null;

  const activities = data.activities;

  return (
    <div className="mt-3">
      <div className="border-y border-stroke-base py-2 flex items-center gap-4 bg-surface-dimmed uppercase text-xs font-bold">
        <div className="px-4 w-32">{t("Time")}</div>
        <div className="px-4">{t("Activity Description")}</div>
      </div>

      {activities.map((activity: AdminApi.Activity) => (
        <div key={activity.id} className="border-b border-stroke-base py-2 flex items-center gap-4">
          <div className="px-4 text-sm text-content-dimmed w-32">
            {activity.insertedAt ? (
              <FormattedTime {...formattedTimePreferences} time={activity.insertedAt} format="relative" />
            ) : null}
          </div>
          <div className="px-4 text-sm">{(activity.action ?? "").split("_").join(" ")}</div>
        </div>
      ))}
    </div>
  );
}
