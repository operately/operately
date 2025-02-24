import * as React from "react";
import * as Icons from "@tabler/icons-react";
import Forms from "@/components/Forms";

import { SecondaryButton } from "@/components/Buttons";
import classNames from "classnames";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

export const DimmedLabel = ({ children }) => <div className="text-xs uppercase font-medium mb-1">{children}</div>;

export function Targets() {
  return (
    <div className="mt-6 pt-6 mb-4 border-t border-stroke-base">
      <div className="flex items-center gap-2 mb-4">
        <div className="uppercase text-xs font-bold tracking-wider">Targets</div>
      </div>
      <div className="">
        <div className="grid grid-cols-1">
          <Target name="Figure out how to open a new office in Brazil" value={0} total={0} progress={0} index={1} />
          <Target name="Eliminate blockers for selling in China" value={4} total={20} progress={20} index={2} />
          <Target name="Achieve 1000+ active users in new countries" value={700} total={1000} progress={70} index={3} />
          <Target
            name="Increase revenue by 20% from international sales"
            value={"$ 1.2M"}
            total={"$ 1M"}
            progress={100}
            index={4}
          />
        </div>

        <div className="mt-4" />
        <AddTarget />
      </div>
    </div>
  );
}

function Target({ name, value, total, progress, index }) {
  return (
    <DivLink className="hover:bg-surface-highlight px-2 py-2 -mx-2" to={Paths.targetPath(index.toString())}>
      <div className="flex items-start justify-between">
        <div className="font-medium">{name}</div>
        <div className="tracking-wider text-sm font-medium">
          {value} / {total}
        </div>
      </div>

      <LargeProgress progress={progress} color="bg-accent-1" />
    </DivLink>
  );
}

function LargeProgress({ progress, color }) {
  const outer = classNames("h-1.5 bg-stroke-base mt-2");
  const inner = classNames("h-1.5", color);

  return (
    <div className={outer}>
      <div className={inner} style={{ width: progress + "%" }} />
    </div>
  );
}

function AddTarget() {
  const [state, setState] = React.useState<"idle" | "form">("idle");

  if (state === "idle") {
    return <AddTargetButton onClick={() => setState("form")} />;
  } else {
    return <AddTargetForm />;
  }
}

function AddTargetButton({ onClick }) {
  return (
    <SecondaryButton size="xs" onClick={onClick}>
      Add target
    </SecondaryButton>
  );
}

function AddTargetForm() {
  const form = Forms.useForm({
    fields: {
      name: "",
      start: "",
      target: "",
    },
    submit: (values) => {
      console.log("submit", values);
    },
  });

  return (
    <div className="border border-surface-outline p-4 pt-8 rounded-lg relative">
      <Icons.IconX size={16} onClick={close} className="absolute top-2 right-2 cursor-pointer" />
      <Forms.Form form={form}>
        <Forms.FieldGroup layout="horizontal">
          <Forms.TextInput field="name" placeholder="e.g. Increase revenue by 20%" label="Name" />
          <Forms.TextInput field="start" placeholder="e.g. 1000" label="Start Value" />
          <Forms.TextInput field="target" placeholder="e.g. 10000" label="Target Value" />
        </Forms.FieldGroup>
      </Forms.Form>
    </div>
  );
}
