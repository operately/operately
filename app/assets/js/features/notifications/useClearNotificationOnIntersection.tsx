import { useEffect, useRef } from "react";
import { useMarkNotificationAsRead, Notification } from "@/models/notifications";

export function useClearNotificationOnIntersection(notification: Notification) {
  const [markNotificationAsRead] = useMarkNotificationAsRead();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const options = {
      root: null,
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(handleIntersect, options);

    function handleIntersect(entries, observer) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          markNotificationAsRead({ id: notification.id });
          observer.unobserve(entry.target);
        }
      });
    }

    if (ref.current && notification && !notification.read) {
      // setTimeout prevents the callback function from being fired when IntersectionObserver
      // is instantiated, which is its default behavior.
      setTimeout(() => observer.observe(ref.current!), 500);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return ref;
}
