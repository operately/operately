import React from "react";

//
// A field group is a container for form fields. It can either lay out its children
// horizontally or vertically.
//
// In horizontal layout, the label and input are placed side by side, e.g.:
//
//   Label: [ Input ]
//          Error message
//
//   Label: [ Input ]
//          Error message
//
// In vertical layout, the label, input, and error message are stacked on top of each other, e.g.:
//
//   Label
//   [ Input ]
//   Error message
//
//   Label
//   [ Input ]
//   Error message
//

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

interface FieldGroupItemProps {
  label: React.ReactNode;
  input: React.ReactNode;
  error: React.ReactNode;
}

export function FieldGroupItem(props: FieldGroupItemProps) {
  const config = React.useContext(FieldGroupContext);
  if (!config) throw new Error("FieldGroupItem must be used within a FieldGroup component");

  if (config.layout === "horizontal") {
    return <HorizontalFieldGroupItem {...props} />;
  }

  if (config.layout === "vertical") {
    return <VerticalFieldGroupItem {...props} />;
  }

  throw new Error("Invalid layout");
}

function HorizontalFieldGroupItem({ label, input, error }: FieldGroupItemProps) {
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

function VerticalFieldGroupItem({ label, input, error }: FieldGroupItemProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {label}
      {input}
      {error}
    </div>
  );
}
