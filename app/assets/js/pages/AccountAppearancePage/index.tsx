import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as People from "@/models/people";

import classnames from "classnames";
import Forms from "@/components/Forms";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";
import { useTheme, useSetTheme } from "@/contexts/ThemeContext";
import { PageNavigation } from "@/features/accounts/PageNavigation";

export const loader = Pages.emptyLoader;

export function Page() {
  return (
    <Pages.Page title={["Apperance", "Account"]}>
      <Paper.Root size="small">
        <PageNavigation />
        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const me = useMe()!;
  const currentTheme = useTheme();
  const navigate = useNavigate();

  const form = Forms.useForm({
    fields: {
      theme: currentTheme,
    },
    submit: async () => {
      await People.updateProfile({ id: me.id, theme: form.values.theme });
      navigate(Paths.accountPath());
    },
  });

  return (
    <Forms.Form form={form}>
      <h1 className="text-2xl font-bold">Appearance</h1>

      <h2 className="font-bold mt-8">Color Mode</h2>
      <p className="text-sm text-content-dimmed">
        Choose if appearance should be light, or dark, or follow your computer's settings.
      </p>

      <div className="grid grid-cols-3 gap-4 mt-4 h-32">
        <ColorModeOption icon={Icons.IconSun} title="Always Light" theme="light" />
        <ColorModeOption icon={Icons.IconMoon} title="Always Dark" theme="dark" />
        <ColorModeOption icon={Icons.IconDeviceLaptop} title="Same as System" theme="system" />
      </div>

      <Forms.Submit saveText="Save Changes" />
    </Forms.Form>
  );
}

function ColorModeOption({ theme, icon, title }) {
  const currentTheme = useTheme();
  const setTheme = useSetTheme();

  const className = classnames(
    "rounded",
    "border",
    "flex flex-col items-center justify-center gap-2",
    "p-4",
    "cursor-pointer",
    "hover:bg-surface-accent",
    {
      "bg-surface-dimmed": currentTheme !== theme,
      "border-accent-1": currentTheme === theme,
      "border-surface-outline": currentTheme !== theme,
    },
  );

  const [_, setValue] = Forms.useFieldValue("theme");

  const changeTheme = () => {
    setValue(theme);
    setTheme(theme);
  };

  return (
    <div className={className} onClick={changeTheme} data-test-id={`color-mode-${theme}`}>
      {React.createElement(icon, { size: 32, strokeWidth: 1.5 })}
      <span className="font-semibold">{title}</span>
    </div>
  );
}
