import React from "react";
import { useGetMe } from "@/models/people";

const ThemeContext = React.createContext({
  theme: "dark",
  colorMode: "dark",
  setTheme: (_theme: string) => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error } = useGetMe({});

  if (loading) return null;

  if (!error) {
    return <Context userTheme={data!.me!.theme!}>{children}</Context>;
  } else {
    return <Context userTheme={"system"}>{children}</Context>;
  }
}

function Context({ userTheme, children }: { userTheme: string; children: React.ReactNode }) {
  const [theme, setTheme] = React.useState(userTheme);
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
    document.querySelector("body")!.dataset.theme = colorMode;
  }, [colorMode]);

  return <ThemeContext.Provider value={{ theme, colorMode, setTheme }}>{children}</ThemeContext.Provider>;
}

function useSystemColorModeListener(theme: string, setColorMode: (mode: "dark" | "light") => void) {
  React.useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme:dark)");

    const listener = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        setColorMode(e.matches ? "dark" : "light");
      }
    };

    isDark.addEventListener("change", listener);

    return () => {
      isDark.removeEventListener("change", listener);
    };
  }, [theme, setColorMode]);
}

export function useColorMode() {
  const { colorMode } = React.useContext(ThemeContext);

  return colorMode;
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
