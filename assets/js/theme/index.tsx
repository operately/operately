import React from "react";
import * as Me from "@/graphql/Me";

export const ThemeContext = React.createContext({
  theme: "dark",
  setTheme: (_theme: string) => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error } = Me.useMe();

  if (loading) return null;
  if (error) return null;

  if (!data) {
    return null;
  }

  return <Context userTheme={data.me.theme}>{children}</Context>;
}

function Context({ userTheme, children }: { userTheme: string; children: React.ReactNode }) {
  const [theme, setTheme] = React.useState(userTheme);

  React.useEffect(() => {
    if (theme === "system") {
      document.querySelector("body")!.dataset.theme = getSystemMode();
    } else {
      document.querySelector("body")!.dataset.theme = theme;
    }
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const { theme } = React.useContext(ThemeContext);

  return theme;
}

export function useSetTheme() {
  const { setTheme } = React.useContext(ThemeContext);

  return setTheme;
}

function getSystemMode(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
