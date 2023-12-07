import React from "react";

import classnames from "classnames";

import * as Icons from "@tabler/icons-react";

interface GroupColorChooserProps {
  color: string;
  name: string;
  setColor: (color: string) => void;
}

export function GroupColorChooser({ color, name, setColor }: GroupColorChooserProps) {
  return (
    <>
      <h2 className="font-bold">Color</h2>
      <p className="text-sm text-content-dimmed">Choose a color for the {name} Space.</p>

      <div className="flex items-center gap-2 mt-2">
        <ColorOption setColor={setColor} color="text-blue-500" current={color} />
        <ColorOption setColor={setColor} color="text-green-500" current={color} />
        <ColorOption setColor={setColor} color="text-red-500" current={color} />
        <ColorOption setColor={setColor} color="text-yellow-500" current={color} />
        <ColorOption setColor={setColor} color="text-purple-500" current={color} />
        <ColorOption setColor={setColor} color="text-pink-500" current={color} />
      </div>
    </>
  );
}

const fgtobg = {
  "text-blue-500": "bg-blue-500",
  "text-green-500": "bg-green-500",
  "text-red-500": "bg-red-500",
  "text-yellow-500": "bg-yellow-500",
  "text-purple-500": "bg-purple-500",
  "text-pink-500": "bg-pink-500",
};

function ColorOption({ color, current, setColor }) {
  const className = classnames("w-12 h-12 rounded flex items-center justify-center cursor-pointer", fgtobg[color]);

  return (
    <div className={className} onClick={() => setColor(color)} data-test-id={`color-${color}`}>
      {color === current && <Icons.IconCheck className="text-content-accent" size={24} />}
    </div>
  );
}
