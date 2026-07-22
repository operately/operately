import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { Page } from ".";
import { match } from "ts-pattern";
import { SecondaryButton } from "../Button";
import { DivLink } from "../Link";
import { IconX, IconDots } from "../icons";
import { createTestId } from "../TestableElement";
import { useWindowSizeBiggerOrEqualTo } from "../utils/useWindowSizeBreakpoint";

import classNames from "classnames";

export function PageOptions({ options, testId = "options-button" }: { options?: Page.Option[]; testId?: string }) {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  const isBigScreen = useWindowSizeBiggerOrEqualTo("lg");

  if (!options) {
    return null;
  }

  const visibleOptions = options.filter((option) => !option.hidden);

  if (visibleOptions.length === 0) {
    return null;
  }

  const [outsideOptions, insideOptions] = splitOptions(isBigScreen, visibleOptions);

  return (
    <div className="absolute right-0 top-0">
      <div className="absolute right-2.5 top-2.5 flex items-center gap-2">
        <OutsideButtons options={outsideOptions} />

        {insideOptions.length > 0 && (
          <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
            <Trigger testId={testId} />
            <Content close={close} options={insideOptions} />
          </DropdownMenu.Root>
        )}
      </div>
    </div>
  );
}

function OutsideButtons({ options }: { options: Page.Option[] }) {
  if (options.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {options.map((option, index) =>
        match(option.type)
          .with("link", () => <OutsideLink key={index} {...option} />)
          .with("action", () => <OutsideAction key={index} {...option} />)
          .exhaustive(),
      )}
    </div>
  );
}

function OutsideLink(props: Page.Option) {
  return (
    <SecondaryButton size="xs" linkTo={props.link!} testId={props.testId ?? "page-option-" + createTestId(props.label)}>
      {props.label}
    </SecondaryButton>
  );
}

function OutsideAction(props: Page.Option) {
  return (
    <SecondaryButton
      size="xs"
      onClick={props.onClick}
      testId={props.testId ?? "page-option-" + createTestId(props.label)}
    >
      {props.label}
    </SecondaryButton>
  );
}

function Trigger({ testId }: { testId: string }) {
  const className = classNames({
    "rounded-full border border-surface-outline cursor-pointer": true,
    "p-1 hover:bg-surface-dimmed": true,
  });

  return (
    <DropdownMenu.Trigger className={className} data-test-id={testId}>
      <IconDots size={20} />
    </DropdownMenu.Trigger>
  );
}

function Content({ close, options }: { close: () => void; options: Page.Option[] }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        className="z-50 shadow-lg bg-accent-1 w-[300px] text-white-1 font-medium flex flex-col"
        align="end"
        alignOffset={-10}
        sideOffset={-40}
      >
        <Close onClick={close} />
        <Items options={options} close={close} />
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

function Items({ options, close }: { options: Page.Option[]; close: () => void }): React.ReactElement[] {
  return options.map((option, index) =>
    match(option.type)
      .with("link", () => <Link {...option} key={index} />)
      .with("action", () => <Action {...option} key={index} close={close} />)
      .exhaustive(),
  );
}

function Link(props: Page.Option) {
  return (
    <DropdownMenu.Item>
      <DivLink
        to={props.link!}
        className="flex items-center gap-2 py-2 px-4 hover:bg-shade-1 cursor-pointer"
        testId={props.testId ?? "page-option-" + createTestId(props.label)}
      >
        {React.createElement(props.icon, { size: 20 })}
        {props.label}
      </DivLink>
    </DropdownMenu.Item>
  );
}

function Action(props: Page.Option & { close: () => void }) {
  const handleClick = () => {
    props.onClick?.();
    props.close();
  };

  return (
    <DropdownMenu.Item onSelect={handleClick}>
      <div
        className="flex items-center gap-2 py-2 px-4 hover:bg-shade-1 cursor-pointer"
        data-test-id={props.testId ?? "page-option-" + createTestId(props.label)}
      >
        {React.createElement(props.icon, { size: 20 })}
        {props.label}
      </div>
    </DropdownMenu.Item>
  );
}

function Close({ onClick }) {
  return (
    <div className="flex flex-row-reverse m-4 cursor-pointer">
      <div
        className="p-1 rounded-full border border-content-base"
        onClick={onClick}
        data-test-id="project-options-button"
      >
        <IconX size={20} />
      </div>
    </div>
  );
}

function splitOptions(isBigScreen: boolean, options: Page.Option[]): [Page.Option[], Page.Option[]] {
  if (!isBigScreen) {
    return [[], options];
  }

  const outside: Page.Option[] = [];
  const inside: Page.Option[] = [];

  for (const option of options) {
    if (option.keepOutsideOnBigScreen) {
      outside.push(option);
    } else {
      inside.push(option);
    }
  }

  return [outside, inside];
}
