import Api from "@/api";
import React from "react";

import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";

import { CompanyCreatorOnboardingWizard } from "turboui";

type Data = CompanyCreatorOnboardingWizard.OnCompleteData;

export function Onboarding({ company }) {
  const refresh = Pages.useRefresh();

  const [link, linkLoading] = useInviteLink(company.id!);
  const [completeSetup, completeStatus] = Companies.useCompleteCompanySetup();

  const handleWizardComplete = React.useCallback(
    async (data: Data) => {
      if (completeStatus.loading) return;

      await completeSetup({ spaces: data.spaces });

      refresh();
    },
    [completeStatus.loading, completeSetup, refresh],
  );

  if (linkLoading) return;

  return (
    <CompanyCreatorOnboardingWizard
      invitationLink={link}
      markoImageUrl={"/marko.jpg"}
      onComplete={handleWizardComplete}
      isCompleting={completeStatus.loading}
    />
  );
}

function useInviteLink(companyId: string): [string, boolean] {
  const [link, setLink] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchInviteLink = React.useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const response = await Api.invitations.createInviteLink({});
    const token = response.inviteLink?.token;

    setLink(Companies.createBulkInvitationUrl(token!));
    setLoading(false);
  }, [companyId]);

  React.useEffect(() => {
    if (link || loading) return;

    fetchInviteLink();
  }, [link, loading, fetchInviteLink]);

  return [link, loading];
}
