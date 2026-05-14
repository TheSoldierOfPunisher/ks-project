"use client";

import * as React from "react";
import { getNotifications } from "~/actions/notification.action";

export function NotificationBadge({
  initialCount = 0
}: {
  initialCount?: number;
}) {
  const [count, setCount] = React.useState(initialCount);

  React.useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const data = await getNotifications(1, "all");
      if (!cancelled) setCount(data.unreadCount);
    }
    const interval = window.setInterval(refresh, 30_000);
    refresh();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!count) return null;
  return (
    <span
      aria-label={`${count} unread notifications`}
      className="absolute -right-1 -top-1 rounded-full bg-danger px-1.5 py-0.5 text-[10px] text-white"
    >
      {count}
    </span>
  );
}
