import { useState } from "react";

import * as Companies from "@/models/companies";
import { logIn } from "@/models/people";
import { camelCaseToSpacedWords } from "@/utils/strings";

export interface FormState {
  fields: FormFields;
  errors: FormError[];
  submitting: boolean;
  submit: () => Promise<boolean>;
}

export interface FormFields {
  companyName: string;
  fullName: string;
  email: string;
  role: string;
  password: string;
  passwordConfirmation: string;

  setCompanyName: (name: string) => void;
  setFullName: (content: string) => void;
  setEmail: (content: string) => void;
  setRole: (content: string) => void;
  setPassword: (content: string) => void;
  setPasswordConfirmation: (content: string) => void;
}

export interface FormError {
  field: string;
  message: string;
}

export function useForm(): FormState {
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const fields = {
    companyName,
    setCompanyName,
    fullName,
    setFullName,
    email,
    setEmail,
    role,
    setRole,
    password,
    setPassword,
    passwordConfirmation,
    setPasswordConfirmation,
  };

  const { submit, submitting, errors } = useSubmit(fields);

  return {
    fields,
    errors,
    submitting,
    submit,
  };
}

function useSubmit(fields: FormFields) {
  const [errors, setErrors] = useState<FormError[]>([]);

  const [add, { loading: submitting }] = Companies.useAddFirstCompany();

  const submit = async () => {
    let errors = validate(fields);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    await add({
      companyName: fields.companyName,
      fullName: fields.fullName,
      email: fields.email,
      role: fields.role,
      password: fields.password,
      passwordConfirmation: fields.passwordConfirmation,
    });

    logIn(fields.email, fields.password).then(() => {
      window.location.href = "/";
    });

    return true;
  };

  return {
    submit,
    submitting,
    errors,
  };
}

function validate(fields: FormFields): FormError[] {
  let result: FormError[] = [];

  for (let key in fields) {
    if (!fields[key]) {
      const fieldName = camelCaseToSpacedWords(key, { capitalizeFirst: true });
      result.push({ field: key, message: `${fieldName} is required` });
    }
  }

  if (fields.companyName.length < 3) {
    result.push({ field: "companyName", message: "Company name must have at least 3 characters" });
  }

  if (fields.email.includes(" ") || !fields.email.includes("@")) {
    result.push({ field: "email", message: "Email must have the @ sign and no spaces" });
  }

  if (fields.email.length > 160) {
    result.push({ field: "email", message: "Email must not have more than 160 characters" });
  }

  if (fields.password.length < 12) {
    result.push({ field: "password", message: "Passoword must have at least 12 characters" });
  }

  if (fields.password.length > 72) {
    result.push({ field: "password", message: "Passoword must not have more than 72 characters" });
  }

  if (fields.password !== fields.passwordConfirmation) {
    result.push({ field: "password", message: "Passoword and password confirmation do not match" });
  }

  return result;
}
