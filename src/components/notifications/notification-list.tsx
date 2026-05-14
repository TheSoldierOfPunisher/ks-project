import {
  getNotifications,
  type NotificationFilter
} from "~/actions/notification.action";
import { Button } from "~/components/button";
import { NotificationItem } from "./notification-item";

export async function NotificationList({
  filter = "all",
  page = 1
}: {
  filter?: NotificationFilter;
  page?: number;
}) {
  const data = await getNotifications(page, filter);

  const filterHref = (nextFilter: NotificationFilter) =>
    `/notifications?filter=${nextFilter}&page=1`;
  const pageHref = (targetPage: number) =>
    `/notifications?filter=${filter}&page=${targetPage}`;

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-2" aria-label="Notification filters">
        {(["all", "unread", "participating"] as const).map((item) => (
          <Button
            key={item}
            href={filterHref(item)}
            variant={filter === item ? "secondary" : "ghost"}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </nav>

      <div className="flex flex-col gap-3">
        {data.notifications.length ? (
          data.notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))
        ) : (
          <p className="rounded-md border border-neutral p-4 text-sm text-grey">
            No notifications found.
          </p>
        )}
      </div>

      {data.pageCount > 1 ? (
        <nav
          className="flex items-center justify-center gap-2"
          aria-label="Notification pagination"
        >
          <Button
            href={pageHref(Math.max(1, data.page - 1))}
            variant="ghost"
            aria-disabled={data.page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-grey">
            Page {data.page} of {data.pageCount}
          </span>
          <Button
            href={pageHref(Math.min(data.pageCount, data.page + 1))}
            variant="ghost"
            aria-disabled={data.page >= data.pageCount}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
