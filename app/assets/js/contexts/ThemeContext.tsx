import React from "react";
import { useGetTheme, AccountTheme } from "@/models/people";

interface ThemeContextProps {
  theme: AccountTheme;
  colorMode: "dark" | "light";
  setTheme: (theme: AccountTheme) => void;
}

const ThemeContext = React.createContext<ThemeContextProps>({
  theme: "dark",
  colorMode: "dark",
  setTheme: (_theme: string) => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data } = useGetTheme({});
  const theme = data?.theme || "system";

  return <Context userTheme={theme}>{children}</Context>;
}

function Context({ userTheme, children }: { userTheme: AccountTheme; children: React.ReactNode }) {
  const [theme, setTheme] = React.useState(userTheme);

  React.useEffect(() => {
    setTheme(userTheme);
  }, [userTheme]);

  const [colorMode, setColorMode] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    if (theme === "system") {
      setColorMode(getSystemMode());
    } else {
      setColorMode(theme as "dark" | "light");
    }
  }, [theme]);

  useSystemColorModeListener(theme, setColorMode);

  React.useEffect(() => {
    const html = document.querySelector("html")!;
    html.classList.remove("dark", "light");
    html.classList.add(colorMode);
  }, [colorMode]);

  return <ThemeContext.Provider value={{ theme, colorMode, setTheme }}>{children}</ThemeContext.Provider>;
}

function useSystemColorModeListener(theme: string, setColorMode: (mode: "dark" | "light") => void) {
  React.useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme:dark)");

    const listener = (e: MediaQueryListEvent) => {
      if (theme !== "system") return;
      setColorMode(e.matches ? "dark" : "light");
    };

    isDark.addEventListener("change", listener);

    return () => {
      isDark.removeEventListener("change", listener);
    };
  }, [theme, setColorMode]);
}

function useContext(): ThemeContextProps {
  return React.useContext(ThemeContext) as ThemeContextProps;
}

export function useColorMode() {
  return useContext().colorMode;
}

export function useTheme() {
  return useContext().theme;
}

export function useSetTheme() {
  return useContext().setTheme;
}

function getSystemMode(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
