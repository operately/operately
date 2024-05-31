import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { GhostButton } from "@/components/Button";
import { TextInputNoLabel } from "@/components/Form";
import { useForm } from "./useForm";

export function Page() {
  const { company } = useLoadedData();

  return (
    <Pages.Page title={["Add People", company.name]}>
      <Paper.Root size="small">
        <Paper.Navigation>
          <Paper.NavItem linkTo="/company/admin">Company Administration</Paper.NavItem>
          <Paper.NavSeparator />
          <Paper.NavItem linkTo="/company/admin/managePeople">Manage People</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-2xl font-extrabold">Add a new Member</div>
          <PersonForm />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PersonForm() {
  const form = useForm();

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-center justify-center">
        <div className="w-28 font-bold">Full Name</div>
        <div className="flex-1">
          <TextInputNoLabel
            id="fullName"
            value={form.fullName}
            onChange={form.setFullName}
            placeholder="e.g. John Doe"
            data-test-id="person-full-name"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-28 font-bold">Email</div>
        <div className="flex-1">
          <TextInputNoLabel
            id="email"
            value={form.email}
            onChange={form.setEmail}
            placeholder="e.g. john@yourcompany.com"
            data-test-id="person-email"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-28 font-bold">Title</div>
        <div className="flex-1">
          <TextInputNoLabel
            id="email"
            value={form.title}
            onChange={form.setTitle}
            placeholder="e.g. Software Engineer"
            data-test-id="person-title"
          />
        </div>
      </div>

      {form.result &&
        <div className="flex flex-col pt-2 pb-2">
          Share this url with the new member:
          <u className="text-sm">{form.result}</u>
        </div>
      }

      <div className="flex items-center justify-end gap-2 mt-8">
        <GhostButton linkTo={form.managePeoplePath} type="secondary">
          Discard
        </GhostButton>

        {form.valid && (
          <GhostButton onClick={form.submit} type="primary" testId="submit">
            Add Member
          </GhostButton>
        )}
      </div>
    </div>
  );
}
