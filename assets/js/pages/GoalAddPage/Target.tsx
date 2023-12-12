import React from "react";

import * as Icons from "@tabler/icons-react";

function Row({ icon, name, from, to, unit }) {
  return (
    <div className="flex items-start gap-2 first:border-t border-b border-surface-outline py-2 group/row">
      <div className="flex-1 flex items-center gap-2">
        <div className="w-8 pl-1">{icon}</div>

        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center">{name}</div>
          <div className="w-12 flex items-center">{from}</div>
          <div className="w-12 flex items-center">{to}</div>
          <div className="w-24 flex items-center">{unit}</div>
        </div>
      </div>
    </div>
  );
}

export function TargetHeader() {
  return (
    <Row
      icon={<Icons.IconHash className="text-content-base ml-1.5" size={12} />}
      name={<div className="text-xs font-bold">NAME</div>}
      from={<div className="text-xs font-bold">FROM</div>}
      to={<div className="text-xs font-bold">TO</div>}
      unit={<div className="text-xs font-bold">UNIT</div>}
    />
  );
}

interface TargetProps {
  form: any;
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
      setValue={(val: string) => form.targetList.updateTarget(target.id, "name", val)}
    />
  );

  const fromInput = (
    <NumberInput
      active={active}
      setActive={setActive}
      placeholder={placeholders[1]}
      value={target.from}
      setValue={(val: string) => form.targetList.updateTarget(target.id, "from", val)}
    />
  );

  const toInput = (
    <NumberInput
      active={active}
      setActive={setActive}
      placeholder={placeholders[2]}
      value={target.to}
      setValue={(val: string) => form.targetList.updateTarget(target.id, "to", val)}
    />
  );

  const unitInput = (
    <TextInput
      active={active}
      setActive={setActive}
      placeholder={placeholders[3]}
      value={target.unit}
      setValue={(val: string) => form.targetList.updateTarget(target.id, "unit", val)}
    />
  );

  return <Row icon={icon} name={nameInput} from={fromInput} to={toInput} unit={unitInput} />;
}

function TextInput({ autoFocus = false, placeholder, active, setActive, value, setValue }) {
  return (
    <GenericInput
      autoFocus={autoFocus}
      placeholder={placeholder}
      active={active}
      setActive={setActive}
      value={value}
      setValue={setValue}
    />
  );
}

function NumberInput({ autoFocus = false, placeholder, active, setActive, value, setValue }) {
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
    />
  );
}

function GenericInput({ autoFocus = false, placeholder, active, setActive, value, setValue }) {
  return (
    <input
      className={
        "placeholder:text-content-subtle px-0 py-1 w-full group-hover/row:bg-surface-highlight " +
        (active ? "bg-surface-highlight" : "bg-transparent")
      }
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      autoFocus={autoFocus}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    />
  );
}
