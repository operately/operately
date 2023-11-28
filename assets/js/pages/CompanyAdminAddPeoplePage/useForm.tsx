import * as React from "react";
import { createPath } from "@/utils/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import * as Companies from "@/models/companies";

interface FormState {
  fullName: string;
  setFullName: (value: string) => void;

  email: string;
  setEmail: (value: string) => void;

  title: string;
  setTitle: (value: string) => void;

  managePeoplePath: string;
  submit: () => void;
  valid: boolean;
}

export function useForm(): FormState {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [title, setTitle] = React.useState("");

  const managePeoplePath = createPath("company", "admin", "managePeople");
  const gotoManagePeople = useNavigateTo(managePeoplePath);

  const [add] = Companies.useAddMemberMutation({
    onCompleted: gotoManagePeople,
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

    managePeoplePath,
    submit,
    valid,
  };
}
