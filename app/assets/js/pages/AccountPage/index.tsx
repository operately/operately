import React from "react";
import * as Pages from "@/components/Pages";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { logOut } from "@/routes/auth";
import { PageModule } from "@/routes/types";
import { AccountPage } from "turboui";
import { usePaths } from "@/routes/paths";

export default { name: "AccountPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const me = useMe()!;
  const paths = usePaths();

  const handleLogOut = async () => {
    const res = await logOut();
    if (res === "success") {
      window.location.href = "/";
    }
  };

  return (
    <AccountPage
      person={me}
      profilePath={paths.profileEditPath(me.id!)}
      appearancePath={paths.accountAppearancePath()}
      securityPath={paths.accountSecurityPath()}
      homePath={paths.homePath()}
      onLogOut={handleLogOut}
    />
  );
}
