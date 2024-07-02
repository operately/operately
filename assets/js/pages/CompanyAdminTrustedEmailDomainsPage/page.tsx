import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as Forms from "@/components/Form";

import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";
import { GhostButton } from "@/components/Button";
import { createTestId } from "@/utils/testid";
import { Paths } from "@/routes/paths";

export function Page() {
  const { company } = useLoadedData();
  const form = useForm({ company });

  return (
    <Pages.Page title={["Trusted Email Domains", company.name]}>
      <Paper.Root size="small">
        <Paper.Navigation>
          <Paper.NavItem linkTo={Paths.companyAdminPath()}>Company Administration</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Trusted Email Domains</div>

          <div className="text-content-accent font-bold mt-8 text-lg">What's this?</div>
          <p>
            Trusted email domains are email domains that are allowed to sign up for an account in this company. If a
            user signs up with an email address that is not from a trusted domain, and she wasn't manually added by an
            admin, they will be denied access.
          </p>

          <div className="text-content-accent font-bold mt-8 text-lg mb-2">Trusted Email Domains</div>
          <TrustedEmailDomainsList form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function TrustedEmailDomainsList({ form }: { form: FormState }) {
  return (
    <div className="flex flex-col gap-2">
      {form.domains.length === 0 && (
        <div className="text-content-dimmed">No trusted email domains. Only manually added members can sign up.</div>
      )}

      {form.domains.map((domain, index) => (
        <TrustedEmailDomainItem key={index} domain={domain} form={form} />
      ))}
      <AddTrustedEmailDomain form={form} />
    </div>
  );
}

function TrustedEmailDomainItem({ domain, form }: { domain: string; form: FormState }) {
  const removeTestId = createTestId("remove-trusted-email-domain", domain);

  return (
    <div className="flex items-center gap-2 bg-surface-dimmed border border-stroke-base px-3 py-2 rounded">
      <div className="flex-1 font-medium">{domain}</div>
      <Icons.IconTrash
        className="text-content-dimmed cursor-pointer hover:text-red-500 shrink-0"
        size={16}
        onClick={() => form.removeDomain(domain)}
        data-test-id={removeTestId}
      />
    </div>
  );
}

function AddTrustedEmailDomain({ form }: { form: FormState }) {
  const [domain, setDomain] = React.useState("");

  const submit = async () => {
    let value = domain.trim();

    if (value.length === 0) return;
    if (value[0] !== "@") value = "@" + value;

    await form.addDomain(value);
    setDomain("");
  };

  return (
    <div className="mt-8">
      <div className="text-content-accent font-bold text-lg mb-2">Add Trusted Email Domain</div>

      <div className="flex items-center gap-4">
        <Forms.TextInputNoLabel
          id="domain"
          value={domain}
          onChange={setDomain}
          placeholder="example.com"
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              submit();
            }
          }}
          data-test-id="add-trusted-email-domain-input"
        />

        <GhostButton onClick={submit} type="primary" size="sm" testId="add-trusted-email-domain-button">
          Add
        </GhostButton>
      </div>
    </div>
  );
}
