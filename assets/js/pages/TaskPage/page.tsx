import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Groups from "@/models/groups";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { FilledButton } from "@/components/Button";
import RichContent from "@/components/RichContent";
import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

export function Page() {
  const { task } = useLoadedData();

  return (
    <Pages.Page title={[task.name]}>
      <Paper.Root size="large">
        <Navigation space={task.space} />

        <Paper.Body>
          <div className="flex items-center justify-between border-b border-surface-outline pb-4">
            <div className="font-bold text-2xl">{task.name}</div>
            <FilledButton size="xs" type="primary">
              Mark as Done
            </FilledButton>
          </div>

          <div className="flex gap-8 justify-between items-start mt-8">
            <div className="w-2/3">
              <div className="font-medium">
                <RichContent jsonContent={task.description!} />
              </div>
            </div>

            <div className="w-1/3 flex flex-col border-l border-surface-outline pl-4 divide-y divide-stroke-base">
              <div className="not-first:pt-4 pb-4">
                <div className="uppercase font-medium text-xs text-content-dimmed">Assignee</div>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar person={task.assignee!} size={20} />
                  <div className="forn-medium">{task.assignee ? task.assignee.fullName : "Unassigned"}</div>
                </div>
              </div>

              <div className="not-first:pt-4 pb-4">
                <div className="uppercase font-medium text-xs text-content-dimmed">Status</div>
                <div className="flex items-center gap-2 mt-1">Open</div>
              </div>

              <div className="not-first:pt-4 pb-4">
                <div className="uppercase font-medium text-xs text-content-dimmed">Due Date</div>
                <div className="forn-medium mt-1">
                  <FormattedTime time={task.dueDate} format="short-date" />
                </div>
              </div>

              <div className="not-first:pt-4 pb-4">
                <div className="uppercase font-medium text-xs text-content-dimmed">Priority</div>
                <div className="forn-medium mt-1 capitalize">{task.priority}</div>
              </div>

              <div className="not-first:pt-4 pb-4">
                <div className="uppercase font-medium text-xs text-content-dimmed">Size</div>
                <div className="forn-medium mt-1 capitalize">{task.size}</div>
              </div>
            </div>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

export function Navigation({ space }: { space: Groups.Group }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/spaces/${space.id}/tasks`}>
        {React.createElement(Icons[space.icon], { size: 16, className: space.color })}
        {space.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}
