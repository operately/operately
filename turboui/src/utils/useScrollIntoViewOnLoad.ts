import { useEffect } from "react";
import { useLocation } from "react-router";

export function useScrollIntoViewOnLoad(id: string) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash.slice(1) !== id) return;

    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, hash, id]);
}
