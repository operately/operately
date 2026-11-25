import React from "react";
import { CheckboxItem, ItemIndicator, Group, Label } from "../Embedding/DropdownMenu";
import { IconCheck } from "../icons";
import { MenuSeparator, SubMenu } from "../Menu";
import { useWindowSizeBreakpoints } from "../utils/useWindowSizeBreakpoint";

export function ChoiceGroup({
  label,
  valueLabel,
  children,
}: React.PropsWithChildren<{ label: string; valueLabel?: string }>) {
  const compact = useWindowSizeBreakpoints() === "xs";
  if (compact)
    return (
      <Group aria-label={label}>
        <Label className="px-3 font-semibold">{label}</Label>
        {children}
        <MenuSeparator />
      </Group>
    );
  return (
    <SubMenu label={label} valueLabel={valueLabel}>
      {children}
    </SubMenu>
  );
}

export function CheckChoice({ label, checked, onChange }: { label: string; checked: boolean; onChange?: () => void }) {
  return (
    <CheckboxItem
      checked={checked}
      disabled={!onChange}
      className="flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-surface-highlight data-[disabled]:text-content-dimmed"
      onSelect={(e) => e.preventDefault()}
      onCheckedChange={onChange}
    >
      {label}
      <ItemIndicator>
        <IconCheck size={15} />
      </ItemIndicator>
    </CheckboxItem>
  );
}
