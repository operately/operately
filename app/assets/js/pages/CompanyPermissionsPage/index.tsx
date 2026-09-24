import * as Pages from "@/components/Pages";
import { PageModule } from "@/routes/types";
import { IconCheck, IconX, Page as TurboUIPage } from "turboui";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { translationText } from "@/i18n";
import { usePaths } from "@/routes/paths";
export default { name: "CompanyPermissionsPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const paths = usePaths();
  return (
    <TurboUIPage
      title={translationText(t("Permissions"))}
      size="small"
      navigation={[{ to: paths.companyAdminPath(), label: t("Company Administration") }]}
    >
      <div className="px-10 py-8">
        <div className="font-extrabold text-2xl mb-4 text-center">{t("Permission Breakdown")}</div>

        <Header />

        <Row permission={t("Add spaces")} members={true} admins={true} owners={true} />
        <Row permission={t("Add goals")} members={true} admins={true} owners={true} />
        <Row permission={t("Add projects")} members={true} admins={true} owners={true} />

        <Row permission={t("Invite people")} members={false} admins={true} owners={true} />
        <Row permission={t("Remove people")} members={false} admins={true} owners={true} />
        <Row permission={t("Update profiles")} members={false} admins={true} owners={true} />

        <Row permission={t("Add/Remove admins")} members={false} admins={false} owners={true} />
        <Row permission={t("Add/Remove owners")} members={false} admins={false} owners={true} />
        <Row permission={t("Manage trusted email domains")} members={false} admins={false} owners={true} />
        <Row permission={t("Access any resource")} members={false} admins={false} owners={true} />
      </div>
    </TurboUIPage>
  );
}

function Header() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1 font-bold">{t("Permission")}</div>
      <div className="w-24 flex justify-center font-bold">{t("Members")}</div>
      <div className="w-24 flex justify-center font-bold">{t("Admins")}</div>
      <div className="w-24 flex justify-center font-bold">{t("Owners")}</div>
    </div>
  );
}

function Row({ permission, members, admins, owners }) {
  return (
    <div className="flex items-center justify-between border-t border-stroke-base py-2">
      <div className="flex-1">{permission}</div>
      <div className="w-24 flex justify-center">{members ? <Yes /> : <No />}</div>
      <div className="w-24 flex justify-center">{admins ? <Yes /> : <No />}</div>
      <div className="w-24 flex justify-center">{owners ? <Yes /> : <No />}</div>
    </div>
  );
}

function Yes() {
  return <IconCheck />;
}

function No() {
  return <IconX className="text-content-subtle" size={16} />;
}
