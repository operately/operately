import { useState } from "react";

import { useAddCompanyMemberMutation } from "@/gql";
import { camelCaseToSpacedWords, snakeCaseToSpacedWords } from "@/utils/strings";


interface FormState {
  fields: FormFields;
  errors: FormError[];
  submitting: boolean;
  submit: () => Promise<boolean>;
  result: string;
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
    fullName, setFullName,
    email, setEmail,
    title, setTitle,
  };

  const { submit, submitting, errors, result } = useSubmit(fields);

  return {
    fields,
    result,
    submit,
    errors,
    submitting,
  };
}

function useSubmit(fields: FormFields) {
  const [errors, setErrors] = useState<FormError[]>([]);
  const [result, setResult] = useState("");
  
  const [add, { loading: submitting }] = useAddCompanyMemberMutation({
    onCompleted: (res) => {
      const url = `${window.location.protocol}//${window.location.host}`;
      const route = "/first-time-login";
      const queryString = "?token=" + res['addCompanyMember']['token'];
      
      setResult(url + route + queryString);
    },
  });

  const submit = async () => {
    const errors = validate(fields);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    try {
      await add({
        variables: {
          input: {
            fullName: fields.fullName,
            email: fields.email,
            title: fields.title,
          },
        },
      });
    }
    catch (e) {
      const errors = e.graphQLErrors.map((error) => {
        const name = snakeCaseToSpacedWords(error.field, { capitalizeFirst: true });

        return {
          field: error.field,
          message: name + " " + error.message,
        }
      });

      setErrors(errors);
    }

    return true;
  }

  return {
    submit,
    submitting,
    errors,
    result,
  };
}

function validate(fields: FormFields): FormError[] {
  let result: FormError[] = [];

  for (let key in fields) {
    const field = fields[key];

    if(typeof field === "string" && !field.trim()) {
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
