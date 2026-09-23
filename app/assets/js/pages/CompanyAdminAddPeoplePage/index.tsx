import * as React from "react";

import * as Billing from "@/models/billing";
import * as Companies from "@/models/companies";
import * as Permissions from "@/models/permissions";

import { PageModule } from "@/routes/types";
import { includesId, usePaths } from "@/routes/paths";
import { useNavigate, useSearchParams } from "react-router";
import { CompanyAdminAddPeoplePage, InviteMemberForm, showErrorToast } from "turboui";
import i18n, { translationText } from "@/i18n";

import { loader, useLoadedData } from "./loader";
import { useMe } from "@/contexts/CurrentCompanyContext";
export default { name: "CompanyAdminAddPeoplePage", loader, Page } as PageModule;

function Page() {
  const { company, ownerIds } = useLoadedData();
  const navigate = useNavigate();
  const paths = usePaths();
  const me = useMe();
  const [searchParams] = useSearchParams();

  const [state, setState] = React.useState<CompanyAdminAddPeoplePage.PageState>({ state: "form" });
  const [limitGuidance, setLimitGuidance] = React.useState<Billing.BillingLimitGuidance | null>(null);
  const [values, setValues] = React.useState<InviteMemberForm.Values>({ fullName: "", email: "", title: "" });
  const [errors, setErrors] = React.useState<InviteMemberForm.Errors>({});
  const memberTypeParam = searchParams.get("memberType");
  const memberType: CompanyAdminAddPeoplePage.MemberType =
    memberTypeParam === "outside_collaborator" ? "outside_collaborator" : "team_member";
  const viewerRole: Billing.BillingLimitViewerRole = includesId(ownerIds, me?.id) ? "owner" : "company_admin";

  const { mutateAsync: grantAccess, isPending: isGrantingAccess } = Permissions.useGrantResourceAccess();

  const navigationItems = React.useMemo(
    () => [
      { to: paths.companyAdminPath(), label: i18n.t("Company Administration") },
      { to: paths.companyManagePeoplePath(), label: i18n.t("Manage Team Members") },
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
    setLimitGuidance(null);
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
    viewerRole,
    paths,
    values,
    setErrors,
    setLimitGuidance,
    setState,
  );

  const commonProps = {
    companyName: company.name || "",
    navigationItems,
    state,
    formValues: values,
    formErrors: errors,
    onFormChange: handleFormChange,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    onInviteAnother: handleInviteAnother,
    onGoBack: handleGoBack,
    goBackLabel: i18n.t("Back"),
    isSubmitting,
    memberType,
    spaces,
    goals,
    projects,
    onGrantAccess: grantAccess,
    isGrantingAccess,
  };

  if (limitGuidance) {
    return (
      <CompanyAdminAddPeoplePage
        {...commonProps}
        limitGuidance={limitGuidance}
        onCloseLimitGuidance={() => setLimitGuidance(null)}
      />
    );
  }

  return <CompanyAdminAddPeoplePage {...commonProps} />;
}

function useInviteSubmit(
  memberType: CompanyAdminAddPeoplePage.MemberType,
  viewerRole: Billing.BillingLimitViewerRole,
  paths: ReturnType<typeof usePaths>,
  values: InviteMemberForm.Values,
  setErrors: React.Dispatch<React.SetStateAction<InviteMemberForm.Errors>>,
  setLimitGuidance: React.Dispatch<React.SetStateAction<Billing.BillingLimitGuidance | null>>,
  setState: React.Dispatch<React.SetStateAction<CompanyAdminAddPeoplePage.PageState>>,
) {
  const loadCollaboratorResources = Companies.useLoadCollaboratorResources();
  const { mutateAsync: add } = Companies.useAddCompanyMember();
  const { mutateAsync: inviteGuest } = Companies.useInviteGuest();

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

    setErrors({});
    setLimitGuidance(null);
    setIsSubmitting(true);

    try {
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        title: values.title.trim(),
      };
      const res = memberType === "outside_collaborator" ? await inviteGuest(payload) : await add(payload);

      const personId = res.personId || "";

      if (memberType === "outside_collaborator") {
        const resources = await loadCollaboratorResources();
        setSpaces(resources.spaces);
        setGoals(resources.goals);
        setProjects(resources.projects);
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
      const limitError = Billing.extractLimitError(e);

      if (limitError?.code === "member_count_limit_exceeded") {
        setLimitGuidance(
          Billing.buildMemberLimitGuidance(limitError, viewerRole, {
            companyBillingPath: () => paths.companyBillingPath(),
            companyBillingPlansPath: (opts) => paths.companyBillingPlansPath(opts),
          }),
        );
        return;
      }

      const data = (e as any)?.response?.data;
      const message = typeof data?.message === "string" ? data.message : null;
      if (message) {
        const lower = message.toLowerCase();
        const nextErrors: InviteMemberForm.Errors = {};

        if (lower.includes("email")) nextErrors.email = message;
        if (lower.includes("name")) nextErrors.fullName = message;

        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
        } else {
          showErrorToast(
            memberType === "outside_collaborator" ? i18n.t("Unable to invite collaborator") : i18n.t("Unable to add team member"),
            message,
          );
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    add,
    inviteGuest,
    isSubmitting,
    memberType,
    paths,
    loadCollaboratorResources,
    setErrors,
    setLimitGuidance,
    setState,
    setSpaces,
    setGoals,
    setProjects,
    values,
    viewerRole,
  ]);

  return { spaces, goals, projects, handleSubmit, isSubmitting };
}
function validateInvite(values: InviteMemberForm.Values): InviteMemberForm.Errors {
  const errors: InviteMemberForm.Errors = {};

  if (values.fullName.length < 1) {
    errors.fullName = translationText(i18n.t("Name is required"));
  }

  if (values.email.length < 1) {
    errors.email = translationText(i18n.t("Email is required"));
  } else if (!values.email.includes("@")) {
    errors.email = translationText(i18n.t("Enter a valid email address"));
  }

  if (values.title.length < 1) {
    errors.title = translationText(i18n.t("Title is required"));
  }

  return errors;
}
