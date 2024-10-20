import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollIntoViewOnLoad(id: string) {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.slice(1);

    if (hash === id) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }, [location]);
}
