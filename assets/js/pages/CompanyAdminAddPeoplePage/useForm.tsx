import { useCallback, useState } from "react";
import * as Companies from "@/models/companies";

import { camelCaseToSpacedWords } from "@/utils/strings";
import { createInvitationUrl } from "@/features/CompanyAdmin";

interface FormState {
  fields: FormFields;
  errors: FormError[];
  submitting: boolean;
  submit: () => Promise<boolean>;
  result: string;
  reset: () => void;
}

interface FormFields {
  fullName: string;
  email: string;
  title: string;

  setFullName: (value: string) => void;
  setEmail: (value: string) => void;
  setTitle: (value: string) => void;
}

interface FormError {
  field: string;
  message: string;
}

export function useForm(): FormState {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");

  const fields = {
    fullName,
    setFullName,
    email,
    setEmail,
    title,
    setTitle,
  };

  const { submit, submitting, errors, result, reset: submitReset } = useSubmit(fields);

  const reset = useCallback(() => {
    setFullName("");
    setEmail("");
    setTitle("");
    submitReset();
  }, []);

  return {
    fields,
    result,
    submit,
    errors,
    submitting,
    reset,
  };
}

function useSubmit(fields: FormFields) {
  const [errors, setErrors] = useState<FormError[]>([]);
  const [result, setResult] = useState("");

  const [add, { loading: submitting }] = Companies.useAddCompanyMember();

  const submit = async () => {
    const errors = validate(fields);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    try {
      const res = await add({ fullName: fields.fullName, email: fields.email, title: fields.title! });
      const url = createInvitationUrl(res.invitation!.token!);

      setResult(url);
    } catch (e) {
      if (e.response?.data?.message) {
        setErrors([{ field: "email", message: e.response.data.message }]);
      } else {
        throw e;
      }
    }

    return true;
  };

  const reset = useCallback(() => {
    setErrors([]);
    setResult("");
  }, []);

  return {
    submit,
    submitting,
    errors,
    result,
    reset,
  };
}

function validate(fields: FormFields): FormError[] {
  let result: FormError[] = [];

  for (let key in fields) {
    const field = fields[key];

    if (typeof field === "string" && !field.trim()) {
      const fieldName = camelCaseToSpacedWords(key, { capitalizeFirst: true });
      result.push({ field: key, message: `${fieldName} is required` });
    }
  }

  if (!fields.email.includes("@")) {
    result.push({ field: "email", message: "Email must have the @ sign and no spaces" });
  }

  if (fields.email.length > 160) {
    result.push({ field: "email", message: "Email must not have more than 160 characters" });
  }

  return result;
}
