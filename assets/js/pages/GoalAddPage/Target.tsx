import React from "react";
import classnames from "classnames";
import * as Icons from "@tabler/icons-react";
import { FormState } from "./useForm";

export function TargetHeader() {
  return (
    <Row
      icon={<Icons.IconHash className="text-content-base ml-1.5" size={12} />}
      name={<div className="text-xs font-bold">NAME</div>}
      from={<div className="text-xs font-bold">CURRENT</div>}
      to={<div className="text-xs font-bold">TARGET</div>}
      unit={<div className="text-xs font-bold">UNIT</div>}
    />
  );
}

export function AddTarget({ form }: { form: FormState }) {
  const className = classnames(
    "mt-1",
    "px-1.5 py-0.5",
    "rounded",
    "text-sm text-content-dimmed",
    "hover:bg-surface-highlight",
    "cursor-pointer",
  );

  return (
    <div className="flex items-center gap-2">
      <div className={className} onClick={form.fields.addTarget}>
        + Add More
      </div>
    </div>
  );
}

interface TargetProps {
  form: FormState;
  target: any;
  index: number;
  placeholders?: string[];
}

export function Target({ form, target, placeholders = [], index }: TargetProps) {
  const [active, setActive] = React.useState(false);

  const icon = (
    <div className="rounded-full bg-accent-1 w-5 h-5 flex items-center justify-center ml-0.5">
      <div className="text-xs font-bold text-white-1">{index + 1}</div>
    </div>
  );

  const nameInput = (
    <TextInput
      active={active}
      setActive={setActive}
      placeholder={placeholders[0]}
      value={target.name}
      setValue={(val: string) => form.fields.updateTarget(target.id, "name", val)}
      testId={`target-${index}-name`}
      error={form.errors.find((e) => e.field === `target-${index}-name`)}
    />
  );

  const fromInput = (
    <NumberInput
      active={active}
      setActive={setActive}
      placeholder={placeholders[1]}
      value={target.from}
      setValue={(val: string) => form.fields.updateTarget(target.id, "from", val)}
      testId={`target-${index}-current`}
      error={form.errors.find((e) => e.field === `target-${index}-from`)}
    />
  );

  const toInput = (
    <NumberInput
      active={active}
      setActive={setActive}
      placeholder={placeholders[2]}
      value={target.to}
      setValue={(val: string) => form.fields.updateTarget(target.id, "to", val)}
      testId={`target-${index}-target`}
      error={form.errors.find((e) => e.field === `target-${index}-to`)}
    />
  );

  const unitInput = (
    <TextInput
      active={active}
      setActive={setActive}
      placeholder={placeholders[3]}
      value={target.unit}
      setValue={(val: string) => form.fields.updateTarget(target.id, "unit", val)}
      testId={`target-${index}-unit`}
      error={form.errors.find((e) => e.field === `target-${index}-unit`)}
    />
  );

  const removeButton = (
    <Icons.IconX
      className="text-content-dimmed cursor-pointer"
      size={16}
      onClick={() => form.fields.removeTarget(target.id)}
    />
  );

  return <Row icon={icon} name={nameInput} from={fromInput} to={toInput} unit={unitInput} remove={removeButton} />;
}

function TextInput({ autoFocus = false, placeholder, active, setActive, value, setValue, testId = "", error }) {
  return (
    <GenericInput
      autoFocus={autoFocus}
      placeholder={placeholder}
      active={active}
      setActive={setActive}
      value={value}
      setValue={setValue}
      testId={testId}
      error={error}
    />
  );
}

function NumberInput({ autoFocus = false, placeholder, active, setActive, value, setValue, testId = "", error }) {
  const re = /^[0-9\b\.]+$/;

  const onChange = (str: string) => {
    if (str === "" || re.test(str)) {
      setValue(str);
    }
  };

  return (
    <GenericInput
      autoFocus={autoFocus}
      placeholder={placeholder}
      active={active}
      setActive={setActive}
      value={value}
      setValue={onChange}
      testId={testId}
      error={error}
    />
  );
}

function GenericInput({ autoFocus = false, placeholder, active, setActive, value, setValue, testId = "", error }) {
  const className = classnames(
    "placeholder:text-content-subtle px-0 py-1 w-full group-hover/row:bg-surface-highlight",
    {
      "bg-surface-highlight": active,
      "bg-transparent": !active,
      "bg-red-400/10": error,
    },
  );

  return (
    <input
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      autoFocus={autoFocus}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      data-test-id={testId}
    />
  );
}

function Row({
  icon,
  name,
  from,
  to,
  unit,
  remove = null,
}: {
  icon: any;
  name: any;
  from: any;
  to: any;
  unit: any;
  remove?: any;
}) {
  return (
    <div className="flex items-start gap-2 first:border-t border-b border-surface-outline py-2 group/row relative">
      <div className="flex-1 flex items-center gap-2">
        <div className="w-8 pl-1">{icon}</div>

        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center">{name}</div>
          <div className="w-16 flex items-center">{from}</div>
          <div className="w-16 flex items-center">{to}</div>
          <div className="w-20 flex items-center">{unit}</div>
          {remove && <div className="absolute -right-4 group-hover/row:opacity-100 opacity-0">{remove}</div>}
        </div>
      </div>
    </div>
  );
}
