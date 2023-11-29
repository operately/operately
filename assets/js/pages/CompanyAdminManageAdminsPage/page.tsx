import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { useFrom } from "./useForm";
import { AddAdminsModal } from "./AddAdminsModal";
import { AdminList } from "./AdminList";

export function Page() {
  const { company } = useLoadedData();
  const form = useFrom();

  return (
    <Pages.Page title={["Add/Remove People", "Company Administration"]}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo="/company/admin">Company Administration</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <div className="text-content-accent text-2xl font-extrabold text-center leading-none">
            Administrators of {company.name}
          </div>

          <AddAdminsModal form={form} />
          <AdminList form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
