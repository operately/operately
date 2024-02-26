import * as React from "react";
import * as Projects from "@/models/projects";
import * as KeyResources from "@/models/keyResources";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { createPath } from "@/utils/paths";
import { useEditResource } from "@/models/keyResources";

interface FormState {
  projectId: string;
  resourceType: string;

  name: string;
  setName: (name: string) => void;

  url: string;
  setUrl: (url: string) => void;

  submit: () => void;
  submitting: boolean;
  isValid: boolean;
}

export function useForm(project: Projects.Project, keyResource: KeyResources.KeyResource): FormState {
  const gotoResourceList = useNavigateTo(createPath("projects", project.id, "edit", "resources"));

  const [name, setName] = React.useState(keyResource.title);
  const [url, setUrl] = React.useState(keyResource.link);

  const isValid = React.useMemo(() => {
    return name.length > 0 && url.length > 0;
  }, [name, url]);

  const [edit, { loading }] = useEditResource({
    onCompleted: gotoResourceList,
  });

  const submit = React.useCallback(async () => {
    await edit({
      variables: {
        input: {
          id: keyResource.id,
          title: name,
          link: url,
        },
      },
    });
  }, [name, url, keyResource.id]);

  return {
    projectId: project.id,
    resourceType: keyResource.resourceType,

    name,
    setName,
    url,
    setUrl,

    submit,
    submitting: loading,
    isValid,
  };
}
