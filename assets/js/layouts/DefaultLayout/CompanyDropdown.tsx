import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Api from "@/api";
import * as Popover from "@radix-ui/react-popover";

import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

import classNames from "classnames";
import { createTestId } from "@/utils/testid";

export function CompanyDropdown({ company }: { company: Api.Company }) {
  const dropdownClassName = classNames("rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden");
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div
          className="font-semibold flex items-center gap-1 cursor-pointer group hover:bg-base-accent px-1.5 py-0.5 rounded"
          data-test-id="company-dropdown"
        >
          <Icons.IconBuildingEstate size={16} />
          <div className="font-semibold">{company.name}</div>
          <Icons.IconChevronDown size={16} />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={dropdownClassName} align="start" sideOffset={12} onClick={close}>
          <div className="bg-surface p-3 min-w-[250px]">
            <DropdownItem path={Paths.feedPath()} icon={Icons.IconRss} title="The Feed" />
            <DropdownItem path={Paths.peoplePath()} icon={Icons.IconUserCircle} title="People" />
            <DropdownItem path={Paths.orgChartPath()} icon={Icons.IconBinaryTree2} title="Org Chart" />
            <DropdownSeparator />
            <DropdownItem path={Paths.companyAdminPath()} icon={Icons.IconCircleKey} title="Company Admin" />
            <DropdownItem path={Paths.lobbyPath()} icon={Icons.IconSwitch} title="Switch Company" />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function DropdownItem({ path, icon, title }) {
  return (
    <DivLink
      className="hover:bg-surface-highlight px-2.5 py-1.5 rounded cursor-pointer flex items-center gap-2"
      to={path}
      testId={createTestId("company-dropdown", title)}
    >
      {React.createElement(icon, { size: 18, strokeWidth: 1.5 })}
      <div className="font-medium">{title}</div>
    </DivLink>
  );
}

function DropdownSeparator() {
  return <div className="border-t border-stroke-base my-2"></div>;
}
