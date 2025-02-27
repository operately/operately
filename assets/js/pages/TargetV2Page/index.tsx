import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Icons from "@tabler/icons-react";

import { PrimaryButton } from "@/components/Buttons";
import Avatar from "@/components/Avatar";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { match } from "ts-pattern";
import classNames from "classnames";

export async function loader({ params }) {
  return {
    id: params.id,
  };
}

export function Page() {
  const id = Pages.useLoadedData().id;
  const content = match(id)
    .with("1", () => <Target1 />)
    .with("2", () => <Target2 />)
    .with("3", () => <Target3 />)
    .run();

  return (
    <Pages.Page title={"TargetV2Page"}>
      <Paper.Root>
        <Navigation />
        <Paper.Body>
          <Options />

          <div className="min-h-[500px]">
            {content}

            <Conversation />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Target1() {
  return (
    <div>
      <div className="text-content-accent text-2xl font-extrabold text-center">
        Figure out how to open a new office in Brazil
      </div>

      <div className="mt-1 max-w-xl mx-auto text-center">
        To be able to conduct business in Brazil, we need to open an office there as per local regulations. We've never
        done this before, so ideally we'd like to have a local partner to help us navigate the process.
      </div>

      <div className="mt-8 flex items-center justify-center">
        <PrimaryButton size="sm">Mark as Complete</PrimaryButton>
      </div>
    </div>
  );
}

function Target2() {
  return (
    <div>
      <div className="text-content-accent text-2xl font-extrabold text-center">
        Eliminate blockers for selling in China
      </div>

      <div className="mt-1 max-w-xl mx-auto text-center">
        We have identified 20 key blockers that are preventing us from selling our products in China. Some of these
        blockers are regulatory, some are technical, and some are related to our sales process.
      </div>

      <div className="mt-8"></div>

      <div className="flex flex-col gap-3 mb-12">
        <div className="uppercase text-xs font-semibold text-content-accent mt-4">Pending</div>
        <Check title="Local regulations are incompatible with our product" status="pending" />
        <Check title="Technical integration with local payment providers" status="pending" />
        <Check title="Sales team lacks local language skills" status="pending" />
        <Check title="Local competitors have better pricing" status="pending" />

        <div className="uppercase text-xs font-semibold text-content-accent mt-4">Completed</div>
        <Check title="Local regulations are incompatible with our product" status="done" />
        <Check title="Tariffs on imported goods" status="done" />
      </div>
    </div>
  );
}

function Target3() {
  return (
    <div>
      <div className="text-content-accent text-2xl font-extrabold text-center">
        Achieve 1000+ active users in new countries
      </div>

      <div className="mt-1 max-w-xl mx-auto text-center text-content-dimmed">No description</div>

      <div className="mt-8"></div>

      <div className="border border-stroke-base p-4 rounded-lg mx-auto max-w-2xl shadow">
        <LargeProgress progress={70} color="bg-accent-1" />

        <div className="flex items-center justify-between">
          <div className="">
            <div className="uppercase text-xs">Start</div>
            <div className="font-bold text-xl">0</div>
          </div>

          <div className="text-center">
            <div className="uppercase text-xs text-center">Current</div>
            <div className="font-bold text-xl">700</div>
          </div>

          <div className="text-right">
            <div className="uppercase text-xs">Target</div>
            <div className="font-bold text-xl">1000</div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center">
        <PrimaryButton size="base">Update Progress</PrimaryButton>
      </div>
    </div>
  );
}

function Navigation() {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={"/"}>Marketing</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={"/"}>Goals & Projects</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={"/"}>Expand into New Markets</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Options() {
  return (
    <PageOptions.Root>
      <PageOptions.Link icon={Icons.IconEdit} title="Edit" to={"/"} testId="edit-link-link" keepOutsideOnBigScreen />
      <PageOptions.Action icon={Icons.IconTrash} title="Delete" onClick={() => {}} testId="delete-resource-link" />
    </PageOptions.Root>
  );
}

function Conversation() {
  const me = useMe()!;

  return (
    <div className="mt-8">
      <div className="uppercase text-xs font-bold mb-4">Conversation</div>

      <div className="py-4 border-t border-stroke-base font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar size={32} person={me} />
          Igor added this target
        </div>
        <div className="text-sm text-content-dimmed">2 days ago</div>
      </div>

      <div className="flex items-center py-4 gap-2 border-t border-stroke-base text-content-dimmed">
        <Avatar size={32} person={me} />
        Leave a comment...
      </div>
    </div>
  );
}

function LargeProgress({ progress, color }) {
  const outer = classNames("h-6 bg-stroke-base mb-4 rounded-lg");
  const inner = classNames("h-6 rounded-lg", color);

  return (
    <div className={outer}>
      <div className={inner} style={{ width: progress + "%" }} />
    </div>
  );
}

function Check({ title, status }) {
  if (status !== "done") {
    return (
      <div className="flex items-center gap-3">
        <div className="font-semibold border border-stroke-base p-3 rounded-lg shadow-sm" />
        <div className="font-medium">{title}</div>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-3">
        <div className="font-semibold border border-green-600 p-3 rounded-lg relative shadow-sm shadow-green-200">
          <Icons.IconCheck
            size={20}
            stroke={3}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-700"
          />
        </div>

        <div className="font-medium">
          <s>{title}</s> &bull; <span className="text-sm">10 days ago</span>
        </div>
      </div>
    );
  }
}
