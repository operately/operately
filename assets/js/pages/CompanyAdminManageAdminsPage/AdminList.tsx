import * as React from "react";

import { GhostButton } from "@/components/Button";
import { FormState } from "./useForm";
import { createTestId } from "@/utils/testid";
import Avatar from "@/components/Avatar";

export function AdminList({ form }: { form: FormState }) {
  return (
    <div className="grid grid-cols-3 gap-4 mt-8">
      {form.company.admins!.map((admin) => (
        <AdminListItem key={admin!.id} admin={admin!} form={form} />
      ))}
    </div>
  );
}

function AdminListItem({ admin, form }) {
  const removeTestId = createTestId("remove", admin.fullName);
  const onRemoveClick = () => form.removeAdmin(admin.id);

  return (
    <div className="p-4 rounded border border-surface-outline">
      <div className="flex flex-col gap-2">
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="my-4">
            <Avatar person={admin} size="xlarge" />
          </div>

          <div>
            <div className="font-bold">{admin.fullName}</div>
            <div className="text-sm text-content-dimmed">{admin.title}</div>
          </div>
        </div>

        <div className="flex justify-center">
          {admin.id !== form.me.id ? (
            <GhostButton type="secondary" size="xs" onClick={onRemoveClick} testId={removeTestId}>
              Remove
            </GhostButton>
          ) : (
            <div className="bg-surface-dimmed px-2 py-0.5 rounded-lg text-sm text-accent-1 font-medium">This is me</div>
          )}
        </div>
      </div>
    </div>
  );
}
