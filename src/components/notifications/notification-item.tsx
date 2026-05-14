import Link from "next/link";
import { markNotificationAsRead } from "~/actions/notification.action";
import { Button } from "~/components/button";

export function NotificationItem({ notification }: { notification: any }) {
  const repository = notification.issue?.repository;
  const issueHref =
    repository && notification.issue
      ? `/${repository.creator?.username ?? "repositories"}/${repository.name}/issues/${notification.issue.number}${notification.comment_id ? `#comment-${notification.comment_id}` : ""}`
      : null;

  return (
    <article
      className="rounded-md border border-neutral p-3"
      aria-label={notification.title}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">
            {!notification.read_at ? (
              <span className="text-accent">● </span>
            ) : null}
            {notification.title}
          </div>
          <div className="text-xs text-grey">
            {notification.actor?.username
              ? `@${notification.actor.username} · `
              : null}
            {new Date(notification.created_at).toLocaleString()}
          </div>
        </div>
        {!notification.read_at ? (
          <form action={markNotificationAsRead.bind(null, notification.id)}>
            <Button type="submit" variant="ghost">
              Mark as read
            </Button>
          </form>
        ) : null}
      </div>
      {notification.body ? (
        <p className="mt-2 text-sm text-grey">{notification.body}</p>
      ) : null}
      {issueHref ? (
        <Link
          href={issueHref}
          className="mt-2 inline-flex text-sm text-accent underline"
        >
          Open context
        </Link>
      ) : null}
    </article>
  );
}
