import React from "react";
import { TitleSetupPrompt } from "turboui";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useUpdateProfile } from "@/models/people";

export function MemberOnboarding() {
  const me = useMe();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  if (!me?.titleSetupPending || me.type === "guest" || !me.permissions?.canEditProfile) return null;

  return (
    <TitleSetupPrompt
      key={me.id}
      onSave={async (title) => {
        await updateProfile({ id: me.id, title, titleSetupPending: false });
      }}
      onSkip={async () => {
        await updateProfile({ id: me.id, titleSetupPending: false });
      }}
    />
  );
}
