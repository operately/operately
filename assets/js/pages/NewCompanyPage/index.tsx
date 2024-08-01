import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { TextInput } from "@/components/Form";
import { FilledButton } from "@/components/Button";
import { Logo } from "@/layouts/DefaultLayout/Logo";

interface LoaderResult {
  // TODO: Define what is loaded when you visit this page
}

export async function loader({}): Promise<LoaderResult> {
  return {}; // TODO: Load data here
}

export function Page() {
  // const data = Pages.useLoadedData<LoaderResult>();
  const form = useForm();

  return (
    <Pages.Page title={"New Company"}>
      <Paper.Root size="small">
        <div className="flex items-center justify-center mb-4 mt-24">
          <Link to={Paths.lobbyPath()}>
            <Icons.IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
            Back to the Lobby
          </Link>
        </div>

        <Paper.Body>
          <div className="flex items-center justify-between">
            <div className="">
              <div className="text-content-accent text-2xl font-semibold">New Company</div>
              <div className="text-content-accent">Let&apos;s set up your company in Operately.</div>
            </div>
            <Logo width="40" height="40" />
          </div>

          <div className="mt-8 flex flex-col gap-6">
            <div className="">
              <TextInput
                label="Name of the company"
                placeholder="e.g. Acme Co."
                value={form.companyName}
                onChange={form.setCompanyName}
                error={form.errors.some((e) => e.field === "companyName")}
              />

              {form.errors.some((e) => e.field === "companyName") && (
                <div className="text-red-500 text-sm mt-1">
                  {form.errors.find((e) => e.field === "companyName")?.message}
                </div>
              )}
            </div>

            <div className="">
              <TextInput
                label="What's your role in the company?"
                placeholder="e.g. Founder"
                value={form.role}
                onChange={form.setRole}
                error={form.errors.some((e) => e.field === "role")}
              />

              {form.errors.some((e) => e.field === "role") && (
                <div className="text-red-500 text-sm mt-1">{form.errors.find((e) => e.field === "role")?.message}</div>
              )}
            </div>
          </div>

          <div className="mt-10 flex justify-center gap-4">
            <FilledButton type="primary" onClick={form.submit} bzzzOnClickFailure>
              Create Company
            </FilledButton>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function useForm() {
  const [companyName, setCompanyName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [errors, setErrors] = React.useState<{ field: string; message: string }[]>([]);

  const submit = async (): Promise<boolean> => {
    const foundErrors: { field: string; message: string }[] = [];

    if (!companyName) {
      foundErrors.push({ field: "companyName", message: "Company name can't be blank" });
    }

    if (!role) {
      foundErrors.push({ field: "role", message: "Role can't be blank" });
    }

    if (foundErrors.length > 0) {
      setErrors(foundErrors);
      return false;
    } else {
      setErrors([]);
    }

    return true;
  };

  return {
    companyName,
    setCompanyName,
    role,
    setRole,
    submit,
    errors,
  };
}
