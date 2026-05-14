"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAuthedUser } from "./auth.action";
import { db } from "~/lib/server/db/index.server";
import { issueUserSubscriptions } from "~/lib/server/db/schema/issue.sql";
import { notifications } from "~/lib/server/db/schema/notification.sql";

const NOTIFICATION_PAGE_SIZE = 20;

export type NotificationFilter = "all" | "unread" | "participating";

export async function getNotifications(
  page = 1,
  filter: NotificationFilter = "all"
) {
  const user = await getAuthedUser();
  if (!user)
    return {
      notifications: [],
      unreadCount: 0,
      page: 1,
      pageCount: 1,
      total: 0
    };

  const safePage = Math.max(1, page);
  const baseWhere = eq(notifications.user_id, user.id);
  const whereClause =
    filter === "unread"
      ? and(baseWhere, isNull(notifications.read_at))
      : filter === "participating"
        ? and(
            baseWhere,
            sql`exists (select 1 from ${issueUserSubscriptions} where ${issueUserSubscriptions.issue_id} = ${notifications.issue_id} and ${issueUserSubscriptions.user_id} = ${user.id})`
          )
        : baseWhere;

  const [rows, countResult, unread] = await Promise.all([
    db.query.notifications.findMany({
      where: whereClause,
      orderBy: [desc(notifications.created_at)],
      limit: NOTIFICATION_PAGE_SIZE,
      offset: (safePage - 1) * NOTIFICATION_PAGE_SIZE,
      with: {
        actor: true,
        issue: {
          with: {
            repository: {
              with: {
                creator: true
              }
            }
          }
        },
        comment: true
      }
    }),
    db
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(notifications)
      .where(whereClause),
    db
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(notifications)
      .where(
        and(eq(notifications.user_id, user.id), isNull(notifications.read_at))
      )
  ]);

  const total = countResult[0]?.value ?? 0;
  return {
    notifications: rows,
    unreadCount: unread[0]?.value ?? 0,
    page: safePage,
    pageSize: NOTIFICATION_PAGE_SIZE,
    total,
    pageCount: Math.max(1, Math.ceil(total / NOTIFICATION_PAGE_SIZE))
  };
}

export async function markNotificationAsRead(notificationId: number) {
  const user = await getAuthedUser();
  if (!user) return;
  await db
    .update(notifications)
    .set({ read_at: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.user_id, user.id)
      )
    );
  revalidatePath("/notifications");
}

export async function markAllNotificationsAsRead() {
  const user = await getAuthedUser();
  if (!user) return;
  await db
    .update(notifications)
    .set({ read_at: new Date() })
    .where(eq(notifications.user_id, user.id));
  revalidatePath("/notifications");
}
