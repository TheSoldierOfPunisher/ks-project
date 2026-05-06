"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "~/lib/server/db/index.server";
import { notifications } from "~/lib/server/db/schema/notification.sql";
import { getAuthedUser } from "./auth.action";

export async function getNotifications(page = 1, unreadOnly = false) {
  const user = await getAuthedUser();
  if (!user) return { notifications: [], unreadCount: 0 };

  const pageSize = 20;
  const whereClause = unreadOnly
    ? and(eq(notifications.user_id, user.id), isNull(notifications.read_at))
    : eq(notifications.user_id, user.id);

  const [rows, unread] = await Promise.all([
    db.query.notifications.findMany({
      where: whereClause,
      orderBy: [desc(notifications.created_at)],
      limit: pageSize,
      offset: (page - 1) * pageSize
    }),
    db.select({ value: sql<number>`count(*)`.mapWith(Number) }).from(notifications).where(and(eq(notifications.user_id, user.id), isNull(notifications.read_at)))
  ]);

  return { notifications: rows, unreadCount: unread[0]?.value ?? 0 };
}

export async function markNotificationAsRead(notificationId: number) {
  const user = await getAuthedUser();
  if (!user) return;
  await db.update(notifications).set({ read_at: new Date() }).where(and(eq(notifications.id, notificationId), eq(notifications.user_id, user.id)));
}

export async function markAllNotificationsAsRead() {
  const user = await getAuthedUser();
  if (!user) return;
  await db.update(notifications).set({ read_at: new Date() }).where(eq(notifications.user_id, user.id));
}
