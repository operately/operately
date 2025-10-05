import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as AdminApi from "@/ee/admin_api";
import * as React from "react";
import { EnableFeatureModal } from "./EnableFeatureModal";

import FormattedTime from "@/components/FormattedTime";
import { Avatar, IconFlare, SecondaryButton } from "turboui";

import { useBoolState } from "@/hooks/useBoolState";
import { useLoadedData } from "./loader";

export { loader } from "./loader";

function useStartSupportSession(companyId: string) {
  const [starting, setStarting] = React.useState(false);

  const start = React.useCallback(async () => {
    try {
      setStarting(true);

      const response = await fetch("/admin/api/support-session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start support session");
      }

      const data = await response.json();
      window.location.href = data.redirect_url;
    } catch (error) {
      console.error("Error starting support session:", error);
      // Handle error (show notification, etc.)
    } finally {
      setStarting(false);
    }
  }, [companyId]);

  return { startSupportSession: start, supportSessionStarting: starting };
}

export function Page() {
  const { company } = useLoadedData();
  const { startSupportSession, supportSessionStarting } = useStartSupportSession(company.id!);

  return (
    <Pages.Page title={"Admininstration"} testId="saas-admin-page">
      <Paper.Root size="large">
        <Paper.Navigation items={[{ to: "/admin", label: "All Companies" }]} />

        <Paper.Body>
          <Options />

          <div className="text-3xl font-semibold">{company.name}</div>
          <OwnersSection company={company} />

          <h2 className="mt-8 font-bold">Stats</h2>
          <StatsSection company={company} />

          <h2 className="mt-8 font-bold">Information</h2>
          <Info company={company} />

          <h2 className="mt-8 font-bold">Support Mode</h2>
          <p className="text-sm text-content-accent mb-3 mt-1 max-w-lg">
            Temporarily enable elevated support access for troubleshooting issues with this company's account. You will
            view the account as if you were an owner. Only read access is granted, no changes can be made.
          </p>

          <SecondaryButton
            size="xs"
            onClick={startSupportSession}
            loading={supportSessionStarting}
            testId="start-support-session"
          >
            Start Support Session
          </SecondaryButton>

          <h2 className="mt-8 font-bold">Activity</h2>
          <ActivitySection company={company} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Info({ company }: { company: AdminApi.Company }) {
  return (
    <div className="border-y border-stroke-base py-3 px-1 mt-2 text-sm flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="font-medium w-40">Short ID</div>
        <div className="text-blue-500">
          <code>{company.shortId!}</code>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="font-medium w-40">Database ID</div>
        <div className="text-blue-500">
          <code>{company.uuid!}</code>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="font-medium w-40">Enabled Features</div>
        <div className="text-blue-500">
          <code>{company.enabledFeatures!.join(", ") || "None"}</code>
        </div>
      </div>
    </div>
  );
}

function StatsSection({ company }: { company: AdminApi.Company }) {
  return (
    <div className="border-y border-stroke-base py-3 mt-2">
      <div className="grid grid-cols-4 gap-4 w-full">
        <Stat title="People" value={company.peopleCount!} />
        <Stat title="Spaces" value={company.spacesCount!} />
        <Stat title="Goals" value={company.goalsCount!} />
        <Stat title="Projects" value={company.projectsCount!} />
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
  return (
    <div className="flex gap-12 mt-8">
      {company.owners!.map((owner) => (
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

function ActivitySection({ company }: { company: AdminApi.Company }) {
  const { data } = AdminApi.useGetActivities({ companyId: company.id! });

  if (!data || !data.activities) return null;

  const activities = data.activities;

  return (
    <div className="mt-3">
      <div className="border-y border-stroke-base py-2 flex items-center gap-4 bg-surface-dimmed uppercase text-xs font-bold">
        <div className="px-4 w-32">Time</div>
        <div className="px-4">Activity Description</div>
      </div>

      {activities!.map((activity: AdminApi.Activity) => (
        <div key={activity.id} className="border-b border-stroke-base py-2 flex items-center gap-4">
          <div className="px-4 text-sm text-content-dimmed w-32">
            <FormattedTime time={activity.insertedAt!} format="relative" />
          </div>
          <div className="px-4 text-sm">{activity.action!.split("_").join(" ")}</div>
        </div>
      ))}
    </div>
  );
}

function Options() {
  const [showEnableFeatureModal, toggleEnableFeatureModal] = useBoolState(false);

  return (
    <>
      <PageOptions.Root testId="options-button">
        <PageOptions.Action
          icon={IconFlare}
          title="Enable Feature"
          onClick={toggleEnableFeatureModal}
          testId="enable-feature"
        />
      </PageOptions.Root>

      <EnableFeatureModal isOpen={showEnableFeatureModal} onClose={toggleEnableFeatureModal} />
    </>
  );
}
