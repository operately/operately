import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { GhostButton } from "@/components/Button";
import { TextInputNoLabel } from "@/components/Form";

import { createPath } from "@/utils/paths";
import { useLoadedData } from "./loader";
import { useForm } from "./useForm";
import { InvitationUrl } from "@/features/CompanyAdmin";


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
  const { fields, result, submit, errors } = useForm();
  const managePeoplePath = createPath("company", "admin", "managePeople");

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-center justify-center">
        <div className="w-28 font-bold">Full Name</div>
        <div className="flex-1">
          <TextInputNoLabel
            id="fullName"
            value={fields.fullName}
            onChange={fields.setFullName}
            placeholder="e.g. John Doe"
            error={!!errors.find((e) => e.field === "fullName")?.message}
            data-test-id="person-full-name"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-28 font-bold">Email</div>
        <div className="flex-1">
          <TextInputNoLabel
            id="email"
            value={fields.email}
            onChange={fields.setEmail}
            placeholder="e.g. john@yourcompany.com"
            error={!!errors.find((e) => e.field === "email")?.message}
            data-test-id="person-email"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-28 font-bold">Title</div>
        <div className="flex-1">
          <TextInputNoLabel
            id="person-title"
            value={fields.title}
            onChange={fields.setTitle}
            placeholder="e.g. Software Engineer"
            error={!!errors.find((e) => e.field === "title")?.message}
            data-test-id="person-title"
          />
        </div>
      </div>

      {errors.map((e, idx) => (
        <div key={idx} className="text-red-500 text-sm">{e.message}</div>
      ))}

      <InvitationUrl url={result} />

      <div className="flex items-center justify-end gap-2 mt-8">
        <GhostButton linkTo={managePeoplePath} type="secondary">
          Discard
        </GhostButton>

        <GhostButton onClick={submit} type="primary" testId="submit">
          Add Member
        </GhostButton>
      </div>
    </div>
  );
}
