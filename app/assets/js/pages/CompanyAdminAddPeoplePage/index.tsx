import Api from "@/api";
import * as Companies from "@/models/companies";
import * as React from "react";

import { PageModule } from "@/routes/types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CompanyAdminAddPeoplePage, InviteMemberForm } from "turboui";

import * as Pages from "@/components/Pages";
import { usePaths } from "@/routes/paths";
export default { name: "CompanyAdminAddPeoplePage", loader, Page } as PageModule;

interface LoaderResult {
  company: Companies.Company;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany({ id: params.companyId }).then((d) => d.company!),
  };
}

function Page() {
  const { company } = Pages.useLoadedData<LoaderResult>();
  const navigate = useNavigate();
  const paths = usePaths();
  const [searchParams] = useSearchParams();
  const [add] = Companies.useAddCompanyMember();
  const [inviteGuest] = Api.useInviteGuest();

  const [state, setState] = React.useState<CompanyAdminAddPeoplePage.PageState>({ state: "form" });
  const [values, setValues] = React.useState<InviteMemberForm.Values>({ fullName: "", email: "", title: "" });
  const [errors, setErrors] = React.useState<InviteMemberForm.Errors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const memberTypeParam = searchParams.get("memberType");
  const memberType: CompanyAdminAddPeoplePage.MemberType =
    memberTypeParam === "outside_collaborator" ? "outside_collaborator" : "team_member";

  const navigationItems = React.useMemo(
    () => [
      { to: paths.companyAdminPath(), label: "Company Administration" },
      { to: paths.companyManagePeoplePath(), label: "Manage Team Members" },
    ],
    [paths],
  );

  const handleFormChange = React.useCallback((field: InviteMemberForm.Field, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = React.useCallback(() => {
    setValues({ fullName: "", email: "", title: "" });
    setErrors({});
  }, []);

  const handleInviteAnother = React.useCallback(() => {
    setState({ state: "form" });
    resetForm();
  }, [resetForm]);

  const handleCancel = React.useCallback(() => {
    navigate(paths.companyManagePeoplePath());
  }, [navigate, paths]);

  const handleGoBack = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSubmit = React.useCallback(async () => {
    if (isSubmitting) return;

    const validationErrors = validateInvite(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        title: values.title.trim(),
      };
      const res =
        memberType === "outside_collaborator"
          ? await inviteGuest(payload)
          : await add(payload);

      if (res.newAccount && res.inviteLink?.token) {
        const url = Companies.createInvitationUrl(res.inviteLink.token);
        setState({ state: "invited", inviteLink: url, fullName: values.fullName });
      } else {
        setState({ state: "added", fullName: values.fullName });
      }

      setErrors({});
    } catch (e) {
      console.error(e);
      const data = (e as any)?.response?.data;
      const message = typeof data?.message === "string" ? data.message : null;
      if (message) {
        const lower = message.toLowerCase();
        const nextErrors: InviteMemberForm.Errors = {};

        if (lower.includes("email")) nextErrors.email = message;
        if (lower.includes("name")) nextErrors.fullName = message;

        if (Object.keys(nextErrors).length > 0) {
          setErrors((prev) => ({ ...nextErrors, ...prev }));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [add, inviteGuest, isSubmitting, memberType, values]);

  return (
    <CompanyAdminAddPeoplePage
      companyName={company.name || ""}
      navigationItems={navigationItems}
      state={state}
      formValues={values}
      formErrors={errors}
      onFormChange={handleFormChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onInviteAnother={handleInviteAnother}
      onGoBack={handleGoBack}
      goBackLabel="Back"
      isSubmitting={isSubmitting}
      memberType={memberType}
    />
  );
}

function validateInvite(values: InviteMemberForm.Values): InviteMemberForm.Errors {
  const errors: InviteMemberForm.Errors = {};

  if (values.fullName.length < 3) {
    errors.fullName = "Must be at least 3 characters long";
  }

  if (values.email.length < 3) {
    errors.email = "Must be at least 3 characters long";
  } else if (!values.email.includes("@")) {
    errors.email = "Email must include '@'";
  }

  return errors;
}
