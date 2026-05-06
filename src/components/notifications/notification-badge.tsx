import { getNotifications } from "~/actions/notification.action";

export async function NotificationBadge() {
  const data = await getNotifications(1, false);
  if (!data.unreadCount) return null;
  return <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] text-white">{data.unreadCount}</span>;
}
