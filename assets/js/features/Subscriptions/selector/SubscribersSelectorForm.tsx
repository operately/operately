import * as React from "react";

import Forms from "@/components/Forms";
import { Subscriber } from "@/models/notifications";
import { includesId } from "@/routes/paths";
import { ActionLink } from "@/components/Link";
import { useSubscribersSelectorContext } from "../SubscribersSelectorContext";

export function SubscribersSelectorForm({ closeForm, callback }) {
  const { subscribers, alwaysNotify, selectedSubscribers, setSelectedSubscribers } = useSubscribersSelectorContext();

  const form = Forms.useForm({
    fields: {
      subscribers: selectedSubscribers.map((subscriber) => subscriber.person!.id!),
    },
    submit: async () => {
      setSelectedSubscribers(
        subscribers.filter((subscriber) => includesId(form.values.subscribers, subscriber.person!.id)),
      );
      if (callback) callback(form);
    },
    cancel: closeForm,
  });

  return (
    <Forms.Form form={form}>
      <div className="flex flex-col gap-6">
        <ActionLinks alwaysNotify={alwaysNotify} allSubscribers={subscribers} />

        <div className="max-h-[380px] overflow-y-auto">
          <Forms.MultiPeopleSelectField field="subscribers" options={subscribers} alwaysSelected={alwaysNotify} />
        </div>
        <Forms.Submit saveText="Save selection" cancelText="Never mind" />
      </div>
    </Forms.Form>
  );
}

function ActionLinks({ alwaysNotify, allSubscribers }: { alwaysNotify: Subscriber[]; allSubscribers: Subscriber[] }) {
  const [_, setValue] = Forms.useFieldValue<string[]>("subscribers");

  const handleSelectNoone = () => {
    setValue([...alwaysNotify.map((subscriber) => subscriber.person!.id!)]);
  };

  const handleSelectEveryone = () => {
    setValue([...allSubscribers.map((subscriber) => subscriber.person!.id!)]);
  };

  return (
    <div className="flex items-center gap-3">
      <ActionLink onClick={handleSelectEveryone}>Select everyone</ActionLink>
      <span className="text-content-dimmed">&middot;</span>
      <ActionLink onClick={handleSelectNoone}>Select no one</ActionLink>
    </div>
  );
}
