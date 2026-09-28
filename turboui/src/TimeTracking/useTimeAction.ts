import { useRef, useState } from "react";
import type { TimeActionResult } from "./types";

export function useTimeAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  const run = async (action: () => Promise<TimeActionResult>) => {
    if (lock.current) return false;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) setError(result.error);
      return result.ok;
    } catch {
      setError("The change could not be saved. Please try again.");
      return false;
    } finally {
      lock.current = false;
      setPending(false);
    }
  };

  return { pending, error, run };
}
