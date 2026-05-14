import {
  markAllNotificationsAsRead,
  type NotificationFilter
} from "~/actions/notification.action";
import { Button } from "~/components/button";
import { NotificationList } from "~/components/notifications/notification-list";
import type { PageProps } from "~/lib/types";

const filters = [
  "all",
  "unread",
  "participating"
] satisfies NotificationFilter[];

export default async function NotificationsPage({
  searchParams
}: PageProps<{}, { filter: string; page: string }>) {
  const filter = filters.includes(searchParams?.filter as NotificationFilter)
    ? (searchParams?.filter as NotificationFilter)
    : "all";
  const page = Math.max(1, Number.parseInt(searchParams?.page ?? "1", 10) || 1);

  return (
    <section className="flex flex-col gap-4 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <form action={markAllNotificationsAsRead}>
          <Button type="submit" variant="ghost">
            Mark all as read
          </Button>
        </form>
      </div>
      <NotificationList filter={filter} page={page} />
    </section>
  );
}
