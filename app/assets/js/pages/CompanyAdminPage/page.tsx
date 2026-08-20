import * as React from "react";
import * as Companies from "@/models/companies";

import { CompanyAdminPage, showErrorToast } from "turboui";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { includesId, Paths, usePaths } from "@/routes/paths";
import { useLoadedData } from "./loader";

export function Page() {
  const paths = usePaths();
  const { company, adminIds, ownerIds } = useLoadedData();
  const me = useMe();
  const [deleteCompany] = Companies.useDeleteCompany();

  const isAdmin = includesId(adminIds, me?.id);
  const isOwner = includesId(ownerIds, me?.id);

  const onDeleteCompany = React.useCallback(async () => {
    try {
      await deleteCompany({});
      window.location.href = Paths.lobbyPath();
    } catch (e) {
      console.error("Failed to delete company", e);
      showErrorToast("Error", "Failed to delete company");
      throw e;
    }
  }, [deleteCompany]);

  return (
    <CompanyAdminPage
      companyName={company.name!}
      admins={company.admins ?? []}
      owners={company.owners ?? []}
      isAdmin={isAdmin}
      isOwner={isOwner}
      billingEnabled={window.appConfig.billingEnabled}
      canManageBilling={!!company.permissions?.canManageBilling}
      canEditDetails={!!company.permissions?.canEditDetails}
      canEditTrustedEmailDomains={!!company.permissions?.canEditTrustedEmailDomains}
      homePath={paths.homePath()}
      permissionsPath={paths.companyPermissionsPath()}
      managePeoplePath={paths.companyManagePeoplePath()}
      restoreSuspendedPeoplePath={paths.companyAdminRestoreSuspendedPeoplePath()}
      billingPath={paths.companyBillingPath()}
      renameCompanyPath={paths.companyRenamePath()}
      manageAdminsPath={paths.companyManageAdminsPath()}
      trustedDomainsPath={paths.companyAdminManageTrustedDomainsPath()}
      exportPath={paths.companyExportPath()}
      onDeleteCompany={onDeleteCompany}
    />
  );
}
