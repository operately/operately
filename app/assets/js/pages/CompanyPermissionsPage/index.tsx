import * as Pages from "@/components/Pages";
import { PageModule } from "@/routes/types";
import { IconCheck, IconX, Page as TurboUIPage } from "turboui";
import * as React from "react";

import { usePaths } from "@/routes/paths";
export default { name: "CompanyPermissionsPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  return (
    <TurboUIPage
      title="Permissions"
      size="small"
      navigation={[{ to: paths.companyAdminPath(), label: "Company Administration" }]}
    >
      <div className="px-10 py-8">
        <div className="font-extrabold text-2xl mb-4 text-center">Permission Breakdown</div>

        <Header />

        <Row permission="Add spaces" members={true} admins={true} owners={true} />
        <Row permission="Add goals" members={true} admins={true} owners={true} />
        <Row permission="Add projects" members={true} admins={true} owners={true} />

        <Row permission="Invite people" members={false} admins={true} owners={true} />
        <Row permission="Remove people" members={false} admins={true} owners={true} />
        <Row permission="Update profiles" members={false} admins={true} owners={true} />

        <Row permission="Add/Remove admins" members={false} admins={false} owners={true} />
        <Row permission="Add/Remove owners" members={false} admins={false} owners={true} />
        <Row permission="Manage trusted email domains" members={false} admins={false} owners={true} />
        <Row permission="Access any resource" members={false} admins={false} owners={true} />
      </div>
    </TurboUIPage>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1 font-bold">Permission</div>
      <div className="w-24 flex justify-center font-bold">Members</div>
      <div className="w-24 flex justify-center font-bold">Admins</div>
      <div className="w-24 flex justify-center font-bold">Owners</div>
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
