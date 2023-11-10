import React from "react";

import FormattedTime from "@/components/FormattedTime";

export default function ArchivedBanner({ project }) {
  if (project.isArchived) {
    return (
      <div className="mb-8 -mx-12 -mt-12  bg-yellow-400/10 text-content-accent font-bold flex items-cennter justify-center py-4 rounded-t border-b border-surface-outline leading-none">
        This project was archived on <FormattedTime time={project.archivedAt} format="long-date" />
      </div>
    );
  } else {
    return null;
  }
}
