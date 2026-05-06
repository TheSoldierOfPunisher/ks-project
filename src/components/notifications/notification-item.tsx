import Link from "next/link";
import { markNotificationAsRead } from "~/actions/notification.action";

export function NotificationItem({ notification }: { notification: any }) {
  return <div className="border border-neutral rounded-md p-3">
    <div className="text-sm font-semibold">{notification.title}</div>
    <div className="text-xs text-grey">{notification.body}</div>
    {notification.issue_id ? <Link href={`/issues/${notification.issue_id}`} className="text-xs underline">Open context</Link> : null}
    {!notification.read_at ? <form action={() => markNotificationAsRead(notification.id)}><button className="text-xs mt-2">Mark as read</button></form> : null}
  </div>;
}
