import { getNotifications } from "~/actions/notification.action";
import { NotificationItem } from "./notification-item";

export async function NotificationList({ unreadOnly = false }: { unreadOnly?: boolean }) {
  const data = await getNotifications(1, unreadOnly);
  return <div className="flex flex-col gap-3">{data.notifications.map((n) => <NotificationItem key={n.id} notification={n} />)}</div>;
}
