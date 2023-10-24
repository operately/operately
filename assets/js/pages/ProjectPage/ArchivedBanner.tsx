import React from "react";

import FormattedTime from "@/components/FormattedTime";

export default function ArchivedBanner({ project }) {
  if (project.isArchived) {
    return (
      <div className="bg-yellow-400/10 text-yellow-400 font-bold flex items-cennter justify-center py-3 mb-3 rounded">
        This project was archived on <FormattedTime time={project.archivedAt} format="long-date" />
      </div>
    );
  } else {
    return null;
  }
}
