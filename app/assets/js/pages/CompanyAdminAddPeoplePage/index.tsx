import * as React from "react";

import Api from "@/api";
import * as Companies from "@/models/companies";
import * as Permissions from "@/models/permissions";

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
  const company = await Companies.getCompany({ id: params.companyId, includePermissions: true }).then(
    (res) => res.company,
  );

  if (!company.permissions?.isAdmin) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    company: company,
  };
}

function Page() {
  const { company } = Pages.useLoadedData<LoaderResult>();
  const navigate = useNavigate();
  const paths = usePaths();
  const [searchParams] = useSearchParams();

  const [state, setState] = React.useState<CompanyAdminAddPeoplePage.PageState>({ state: "form" });
  const [values, setValues] = React.useState<InviteMemberForm.Values>({ fullName: "", email: "", title: "" });
  const [errors, setErrors] = React.useState<InviteMemberForm.Errors>({});
  const memberTypeParam = searchParams.get("memberType");
  const memberType: CompanyAdminAddPeoplePage.MemberType =
    memberTypeParam === "outside_collaborator" ? "outside_collaborator" : "team_member";

  const [grantAccess, { loading: isGrantingAccess }] = Permissions.useGrantResourceAccess();

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

  const { handleSubmit, isSubmitting, spaces, goals, projects } = useInviteSubmit(
    memberType,
    values,
    setErrors,
    setState,
  );

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
      spaces={spaces}
      goals={goals}
      projects={projects}
      onGrantAccess={grantAccess}
      isGrantingAccess={isGrantingAccess}
    />
  );
}

function useInviteSubmit(
  memberType: CompanyAdminAddPeoplePage.MemberType,
  values: InviteMemberForm.Values,
  setErrors: React.Dispatch<React.SetStateAction<InviteMemberForm.Errors>>,
  setState: React.Dispatch<React.SetStateAction<CompanyAdminAddPeoplePage.PageState>>,
) {
  const [add] = Companies.useAddCompanyMember();
  const [inviteGuest] = Api.useInviteGuest();

  const [spaces, setSpaces] = React.useState<CompanyAdminAddPeoplePage.ResourceOption[]>([]);
  const [goals, setGoals] = React.useState<CompanyAdminAddPeoplePage.ResourceOption[]>([]);
  const [projects, setProjects] = React.useState<CompanyAdminAddPeoplePage.ResourceOption[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      const res = memberType === "outside_collaborator" ? await inviteGuest(payload) : await add(payload);

      const personId = res.personId || "";

      // Load resources for the access granting form (only for outside collaborators)
      if (memberType === "outside_collaborator") {
        const [spacesData, goalsData, projectsData] = await Promise.all([
          Api.getSpaces({}),
          Api.getGoals({ includeSpace: true }),
          Api.getProjects({}),
        ]);

        setSpaces((spacesData.spaces || []).map((s) => ({ id: s.id, name: s.name })));
        setGoals((goalsData.goals || []).map((g) => ({ id: g.id, name: g.name })));
        setProjects((projectsData.projects || []).map((p) => ({ id: p.id, name: p.name })));
      }

      if (res.newAccount && res.inviteLink?.token) {
        const url = Companies.createInvitationUrl(res.inviteLink.token);
        setState({ state: "invited", inviteLink: url, fullName: values.fullName, personId });
      } else {
        setState({ state: "added", fullName: values.fullName, personId });
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
          setErrors((prev: InviteMemberForm.Errors) => ({ ...nextErrors, ...prev }));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [add, inviteGuest, isSubmitting, memberType, values, setErrors, setState, setSpaces, setGoals, setProjects]);

  return { spaces, goals, projects, handleSubmit, isSubmitting };
}

function validateInvite(values: InviteMemberForm.Values): InviteMemberForm.Errors {
  const errors: InviteMemberForm.Errors = {};

  if (values.fullName.length < 1) {
    errors.fullName = "Name is required";
  }

  if (values.email.length < 1) {
    errors.email = "Email is required";
  } else if (!values.email.includes("@")) {
    errors.email = "Enter a valid email address";
  }

  if (values.title.length < 1) {
    errors.title = "Title is required";
  }

  return errors;
}
