import * as React from "react";
import { createPath } from "@/utils/paths";
import { useAddCompanyMemberMutation } from "@/gql";

interface FormState {
  fullName: string;
  setFullName: (value: string) => void;

  email: string;
  setEmail: (value: string) => void;

  title: string;
  setTitle: (value: string) => void;

  result: string;

  managePeoplePath: string;
  submit: () => void;
  valid: boolean;
}

export function useForm(): FormState {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [result, setResult] = React.useState("");

  const managePeoplePath = createPath("company", "admin", "managePeople");

  const [add] = useAddCompanyMemberMutation({
    onCompleted: (res) => {
      const url = `${window.location.protocol}//${window.location.host}`;
      const route = "/first-time-login";
      const queryString = "?token=" + res['addCompanyMember']['token'];
      
      setResult(url + route + queryString);
    },
  });

  const submit = React.useCallback(async () => {
    await add({
      variables: {
        input: {
          fullName,
          email,
          title,
        },
      },
    });
  }, [fullName, email, title]);

  const valid = React.useMemo(() => {
    return fullName.length > 0 && email.length > 0 && title.length > 0 && email.includes("@");
  }, [fullName, email, title]);

  return {
    fullName,
    setFullName,

    email,
    setEmail,

    title,
    setTitle,

    result,

    managePeoplePath,
    submit,
    valid,
  };
}
