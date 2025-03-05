import React from "react";

import FormattedTime from "@/components/FormattedTime";
import { useLoadedData } from "./loader";

export function Header() {
  const { update } = useLoadedData();

  return (
    <div className="text-content-accent text-2xl font-extrabold">
      Progress Update from <FormattedTime time={update.insertedAt!} format="long-date" />
    </div>
  );
}
