import { markAllNotificationsAsRead } from "~/actions/notification.action";
import { NotificationList } from "~/components/notifications/notification-list";

export default async function NotificationsPage() {
  return <section className="px-5 py-4 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <form action={markAllNotificationsAsRead}><button className="text-sm underline" type="submit">Mark all as read</button></form>
    </div>
    <NotificationList />
  </section>;
}
