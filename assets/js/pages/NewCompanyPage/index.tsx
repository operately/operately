import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Api from "@/api";

import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { TextInput } from "@/components/Form";
import { PrimaryButton } from "@/components/Buttons";
import { Logo } from "@/layouts/DefaultLayout/Logo";
import { useNavigate } from "react-router-dom";

export async function loader({}): Promise<null> {
  return null;
}

export function Page() {
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
                testId="company-name-input"
                label="Name of the company"
                placeholder="e.g. Acme Co."
                value={form.companyName}
                onChange={form.setCompanyName}
                error={form.errors.some((e) => e.field === "companyName")}
              />

              {form.errors.some((e) => e.field === "companyName") && (
                <div className="text-content-error text-sm mt-1">
                  {form.errors.find((e) => e.field === "companyName")?.message}
                </div>
              )}
            </div>

            <div className="">
              <TextInput
                testId="title-input"
                label="What's your title in the company?"
                placeholder="e.g. Founder"
                value={form.title}
                onChange={form.setTitle}
                error={form.errors.some((e) => e.field === "title")}
              />

              {form.errors.some((e) => e.field === "title") && (
                <div className="text-content-error text-sm mt-1">
                  {form.errors.find((e) => e.field === "title")?.message}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 flex justify-center gap-4">
            <PrimaryButton
              type="primary"
              onClick={form.submit}
              bzzzOnClickFailure
              testId="submit"
              loading={form.loading}
            >
              Create Company
            </PrimaryButton>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function useForm() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [errors, setErrors] = React.useState<{ field: string; message: string }[]>([]);

  const [add, { loading: loading }] = Api.useAddCompany();

  const submit = async (): Promise<boolean> => {
    const foundErrors: { field: string; message: string }[] = [];

    if (!companyName) {
      foundErrors.push({ field: "companyName", message: "Company name can't be blank" });
    }

    if (!title) {
      foundErrors.push({ field: "title", message: "Title can't be blank" });
    }

    if (foundErrors.length > 0) {
      setErrors(foundErrors);
      return false;
    } else {
      setErrors([]);
    }

    try {
      const res = await add({ companyName, title });
      navigate(Paths.companyHomePath(res.company.id));

      return true;
    } catch (e) {
      return false;
    }
  };

  return {
    companyName,
    setCompanyName,
    title,
    setTitle,
    submit,
    errors,
    loading,
  };
}
