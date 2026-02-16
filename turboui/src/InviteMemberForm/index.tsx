import React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { Textfield } from "../forms/Textfield";
import classNames from "../utils/classnames";

export namespace InviteMemberForm {
  export type Field = "fullName" | "email" | "title";

  export interface Values {
    fullName: string;
    email: string;
    title: string;
  }

  export type Errors = Partial<Record<Field, string>>;

  export interface Props {
    title?: string;
    values: Values;
    errors?: Errors;
    onChange: (field: Field, value: string) => void;
    onSubmit: () => void | Promise<void>;
    onCancel?: () => void;
    isSubmitting?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    helperText?: React.ReactNode;
    helperTextClassName?: string;
    children?: React.ReactNode;
    testId?: string;
  }
}

export function InviteMemberForm(props: InviteMemberForm.Props) {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void props.onSubmit();
  };

  const helperTextClassName = classNames("my-8 text-center px-20", props.helperTextClassName);

  return (
    <div>
      {props.title && <div className="text-content-accent text-xl sm:text-2xl font-extrabold mb-6 mt-2 sm:mt-0 sm:mb-8">{props.title}</div>}

      <form onSubmit={handleSubmit} data-test-id={props.testId}>
        <div className="flex flex-col gap-4">
          <FormRow label="Full Name" htmlFor="invite-full-name">
            <Textfield
              id="invite-full-name"
              value={props.values.fullName}
              onChange={(event) => props.onChange("fullName", event.target.value)}
              placeholder="e.g. John Doe"
              minLength={3}
              testId="fullname"
              error={props.errors?.fullName}
              className="w-full"
            />
          </FormRow>

          <FormRow label="Email" htmlFor="invite-email">
            <Textfield
              id="invite-email"
              value={props.values.email}
              onChange={(event) => props.onChange("email", event.target.value)}
              placeholder="e.g. john@yourcompany.com"
              minLength={3}
              testId="email"
              error={props.errors?.email}
              className="w-full"
            />
          </FormRow>

          <FormRow label="Title" htmlFor="invite-title">
            <Textfield
              id="invite-title"
              value={props.values.title}
              onChange={(event) => props.onChange("title", event.target.value)}
              placeholder="e.g. Software Engineer"
              testId="title"
              error={props.errors?.title}
              className="w-full"
            />
          </FormRow>
        </div>

        {props.children && <div className="mt-6">{props.children}</div>}

        <div className="flex items-center gap-2 mt-8">
          <PrimaryButton
            type="submit"
            size="sm"
            loading={props.isSubmitting}
            disabled={props.isSubmitting}
            testId="submit"
          >
            {props.submitLabel ?? "Invite Member"}
          </PrimaryButton>

          {props.onCancel && (
            <SecondaryButton
              type="button"
              size="sm"
              onClick={props.onCancel}
              disabled={props.isSubmitting}
              testId="cancel"
            >
              {props.cancelLabel ?? "Cancel"}
            </SecondaryButton>
          )}
        </div>
      </form>

      {props.helperText && <div className={helperTextClassName}>{props.helperText}</div>}
    </div>
  );
}

function FormRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex sm:gap-4 items-center">
      <label htmlFor={htmlFor} className="w-1/4 shrink-0 font-semibold text-left">
        {label}
      </label>
      <div className="w-3/4 flex-1">{children}</div>
    </div>
  );
}
