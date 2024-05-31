import { useState } from "react";

import { useChangePasswordMutation } from "@/models/accounts";
import { logIn } from "@/graphql/Me";
import { useLoadedData } from "./loader";


export interface FormState {
  fields: FormFields;
  errors: FormError[];
  submitting: boolean;
  submit: () => Promise<boolean>;
}

export interface FormFields {
  password: string;
  passwordConfirmation: string;
  
  setPassword: (content: string) => void;
  setPasswordConfirmation: (content: string) => void;
}

export interface FormError {
  field: string;
  message: string;
}


export function useForm(): FormState {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const fields = {
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
  const { invitation, token } = useLoadedData();
  const [errors, setErrors] = useState<FormError[]>([]);

  const [add, { loading: submitting }] = useChangePasswordMutation({
    onCompleted: () => {
      logIn(invitation.member.email!, fields.password)
      .then(() => {
        window.location.href = "/";
      });
    }
  })

  const submit = async () => {
    let errors = validate(fields);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }
    
    await add({
      variables: {
        input: {
          token: token,
          password: fields.password,
          passwordConfirmation: fields.passwordConfirmation,
        },
      },
    });

    return true;
  }
  
  return {
    submit,
    submitting,
    errors,
  };
}


function validate(fields: FormFields): FormError[] {
  let result: FormError[] = [];

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