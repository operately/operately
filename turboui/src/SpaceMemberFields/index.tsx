import * as React from "react";

import * as Forms from "../Forms";
import type { SelectBoxOption, SelectPersonSearchFn } from "../Forms/types";
import { SecondaryButton } from "../Button";
import { IconPlus, IconX } from "../icons";
import { createTestId } from "../TestableElement";

export interface SpaceMemberFieldsProps {
  members: { key: number }[];
  searchPeople: SelectPersonSearchFn;
  accessOptions: SelectBoxOption[];
  labels: {
    member: string;
    accessLevel: string;
    addAnother: string;
    remove: string;
  };
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function SpaceMemberFields({
  members,
  searchPeople,
  accessOptions,
  labels,
  onAdd,
  onRemove,
}: SpaceMemberFieldsProps) {
  return (
    <div>
      <div className="flex flex-col gap-6">
        {members.map((member, index) => (
          <section
            key={member.key}
            data-test-id={`member-${index}`}
            className="relative bg-surface-base px-5 py-8 sm:px-10 sm:border sm:border-surface-outline sm:rounded-lg sm:shadow-xl"
          >
            <div className={index > 0 ? "pt-8 sm:pt-0" : undefined}>
              <Forms.FieldGroup>
                <Forms.SelectPerson
                  field={`members[${index}].personId`}
                  label={labels.member}
                  searchFn={searchPeople}
                />
                <Forms.SelectBox
                  field={`members[${index}].accessLevel`}
                  label={labels.accessLevel}
                  options={accessOptions}
                />
              </Forms.FieldGroup>
            </div>

            {index > 0 && (
              <div className="absolute top-2 right-2 sm:-top-3 sm:-right-3">
                <SecondaryButton
                  testId={`remove-member-${index}`}
                  ariaLabel={labels.remove}
                  className="!rounded-full !p-2 !text-content-subtle hover:!text-content-accent hover:!bg-surface-base"
                  onClick={() => onRemove(index)}
                >
                  <IconX size={16} />
                </SecondaryButton>
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="mt-5 flex justify-center" data-test-id={createTestId("add-more")}>
        <SecondaryButton onClick={onAdd} ariaLabel={labels.addAnother}>
          <IconPlus size={16} />
        </SecondaryButton>
      </div>
    </div>
  );
}
