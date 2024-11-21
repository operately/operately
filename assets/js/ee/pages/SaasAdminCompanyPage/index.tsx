import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as AdminApi from "@/ee/admin_api";
import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

interface LoaderData {
  company: AdminApi.Company;
}

export async function loader({ params }): Promise<LoaderData> {
  return { company: await AdminApi.getCompany({ id: params.companyId }).then((res) => res.company!) };
}

export function Page() {
  const { company } = Pages.useLoadedData() as LoaderData;

  return (
    <Pages.Page title={"Admininstration"} testId="saas-admin-page">
      <Paper.Root size="large">
        <Paper.Navigation>
          <Paper.NavItem linkTo="/admin">All Companies</Paper.NavItem>
        </Paper.Navigation>
        <Paper.Body>
          <div className="text-3xl font-semibold">{company.name}</div>
          <OwnersSection company={company} />
          <StatsSection company={company} />
          <LastActivity company={company} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function StatsSection({ company }: { company: AdminApi.Company }) {
  return (
    <div className="border-y border-stroke-base py-3 mt-8">
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
            <div className="text-[10px] font-bold uppercase text-content-dimmed">Owner</div>
            <div className="font-semibold">{owner.fullName}</div>
            <div className="text-sm text-content-accent">{owner.email}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LastActivity({ company }: { company: AdminApi.Company }) {
  return (
    <div className="mt-8 text-sm">
      Last Activity{" "}
      {company.lastActivityAt ? <FormattedTime time={company.lastActivityAt} format="relative" /> : "Never"}
    </div>
  );
}
