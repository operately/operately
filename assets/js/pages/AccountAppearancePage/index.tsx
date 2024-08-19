import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as People from "@/models/people";

import classnames from "classnames";
import Avatar from "@/components/Avatar";

import { useTheme, useSetTheme } from "@/theme";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { FilledButton } from "@/components/Button";
import { useMe } from "@/contexts/CurrentUserContext";
import { Paths } from "@/routes/paths";

export async function loader(): Promise<null> {
  return null;
}

export function Page() {
  const me = useMe()!;

  return (
    <Pages.Page title={["Apperance", "Account"]}>
      <Paper.Root size="small">
        <Navigation me={me} />
        <Paper.Body minHeight="500px">
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

          <SubmitButton />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SubmitButton() {
  const theme = useTheme();
  const goToAccount = useNavigateTo(Paths.accountPath());
  const [loading, setLoading] = React.useState(false);

  const save = React.useCallback(() => {
    setLoading(true);
    People.updateMyProfile({ theme: theme })
      .then(goToAccount)
      .finally(() => setLoading(false));
  }, [theme]);

  return (
    <div className="flex items-center justify-center mt-8">
      <FilledButton onClick={save} testId="save" loading={loading}>
        Save Changes
      </FilledButton>
    </div>
  );
}

function Navigation({ me }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.accountPath()}>
        <Avatar person={me} size="tiny" />
        Account
      </Paper.NavItem>
    </Paper.Navigation>
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

  const changeTheme = () => {
    setTheme(theme);
  };

  return (
    <div className={className} onClick={changeTheme} data-test-id={`color-mode-${theme}`}>
      {React.createElement(icon, { size: 32, strokeWidth: 1.5 })}
      <span className="font-semibold">{title}</span>
    </div>
  );
}
