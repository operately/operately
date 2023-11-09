import React from "react";
import * as Me from "@/graphql/Me";

export const ThemeContext = React.createContext({
  theme: "dark",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error } = Me.useMe();

  if (loading) return null;
  if (error) return null;

  const theme = data.me.theme || "dark";

  return <Context theme={theme}>{children}</Context>;
}

function Context({ theme, children }: { theme: string; children: React.ReactNode }) {
  React.useEffect(() => {
    document.querySelector("body")!.dataset.theme = theme;
  }, [theme]);

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const { theme } = React.useContext(ThemeContext);

  return theme;
}
