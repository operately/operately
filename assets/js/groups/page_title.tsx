import React from "react";

export default function PageTitle({name: name, description: description, buttons}) {
  return (
    <div className="mb-8 flex justify-between">
      <div className="text-xl font-bold">
        {name}
        <p className="font-normal text-sm">{description}</p>
      </div>

      <div>
        {buttons}
      </div>
    </div>
  );
}

