import React from "react";

type LayoutDirection = "horizontal" | "vertical";

interface FieldGroupConfig {
  layout: LayoutDirection;
}

const FieldGroupContext = React.createContext<FieldGroupConfig | null>(null);

export function FieldGroup({ layout, children }: { layout?: LayoutDirection; children: React.ReactNode }) {
  const config = {
    layout: layout || "vertical",
  };

  return (
    <FieldGroupContext.Provider value={config}>
      <div className="flex flex-col gap-4">{children}</div>
    </FieldGroupContext.Provider>
  );
}

export function FieldGroupItem({
  label,
  input,
  error,
}: {
  input: React.ReactNode;
  label: JSX.Element | null;
  error: JSX.Element | null;
}) {
  const config = React.useContext(FieldGroupContext);
  if (!config) throw new Error("FieldGroupItem must be used within a FieldGroup component");

  if (config.layout === "horizontal") {
    return (
      <div>
        <div className="flex gap-4 items-center">
          <div className="w-1/5 shrink-0">{label}</div>
          <div className="flex flex-col gap-0.5 w-4/5 flex-1">{input}</div>
        </div>

        <div className="flex gap-4 items-center mt-0.5">
          <div className="w-1/5 shrink-0"></div>
          <div className="w-4/5 flex-1">{error}</div>
        </div>
      </div>
    );
  }

  if (config.layout === "vertical") {
    return (
      <div className="flex flex-col gap-0.5">
        {label}
        {input}
        {error}
      </div>
    );
  }

  throw new Error("Invalid layout direction");
}
