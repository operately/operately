import { useState, useEffect } from "react";

export function useRenderInterval(time: Date) {
  const [currentTime, setCurrentTime] = useState(Date.now);
  const timestamp = time.getTime();

  useEffect(() => {
    const diff = Date.now() - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000 * 15);

      return () => clearInterval(interval);
    } else if (minutes < 60) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000 * 60);

      return () => clearInterval(interval);
    } else if (hours < 24) {
      const interval = setInterval(
        () => {
          setCurrentTime(Date.now());
        },
        1000 * 60 * 60,
      );

      return () => clearInterval(interval);
    } else {
      const interval = setInterval(
        () => {
          setCurrentTime(Date.now());
        },
        1000 * 60 * 60 * 24,
      );

      return () => clearInterval(interval);
    }
  }, [timestamp]);

  return currentTime;
}
