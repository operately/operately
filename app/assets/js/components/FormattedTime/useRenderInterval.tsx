import { useState, useEffect } from "react";

export function useRenderInterval(time) {
  const [lastRender, setLastRender] = useState(0);

  useEffect(() => {
    const diff = +new Date() - +time;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      const interval = setInterval(() => {
        setLastRender(Date.now());
      }, 1000 * 15);

      return () => clearInterval(interval);
    } else if (minutes < 60) {
      const interval = setInterval(() => {
        setLastRender(Date.now());
      }, 1000 * 60);

      return () => clearInterval(interval);
    } else if (hours < 24) {
      const interval = setInterval(
        () => {
          setLastRender(Date.now());
        },
        1000 * 60 * 60,
      );

      return () => clearInterval(interval);
    } else {
      const interval = setInterval(
        () => {
          setLastRender(Date.now());
        },
        1000 * 60 * 60 * 24,
      );

      return () => clearInterval(interval);
    }
  }, []);

  return lastRender;
}
