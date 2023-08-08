import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import Button from "@/components/Button";

import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

export async function loader() {
  return { groups: [] };
}

export function Page() {
  useDocumentTitle("Groups");

  return (
    <Paper.Root size="large">
      <div className="flex items-center justify-between">
        <div className="font-extrabold text-3xl">Groups</div>

        <Button linkTo="/groups/new" variant="success">
          <Icons.IconPlus size={16} /> Add Group
        </Button>
      </div>
    </Paper.Root>
  );
}
