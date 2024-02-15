import * as React from "react";

import { DateSelector } from "./Dateselector";

export function Overview({ form }) {
  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      <DueDate form={form} />
    </div>
  );
}

function DueDate({ form }) {
  return (
    <div className="flex flex-col gap-1 text-lg">
      <div className="flex items-center gap-1">
        <DateSelector
          date={form.deadline.date}
          onChange={form.deadline.setDate}
          minDate={null}
          maxDate={null}
          placeholder="Not set"
          testID="due-date"
        />
      </div>
    </div>
  );
}
