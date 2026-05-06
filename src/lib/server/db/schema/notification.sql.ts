import { index, integer, pgEnum, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { pgTable } from "./index.sql";
import { issues } from "./issue.sql";
import { comments } from "./comment.sql";
import { users } from "./user.sql";
import { relations, type InferInsertModel, type InferSelectModel } from "drizzle-orm";

export const notificationTypeEnum = pgEnum("notification_type", [
  "MENTION",
  "NEW_COMMENT",
  "ISSUE_STATUS_CHANGED",
  "ASSIGNED"
]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  actor_id: integer("actor_id").references(() => users.id, { onDelete: "set null" }),
  issue_id: integer("issue_id").references(() => issues.id, { onDelete: "cascade" }),
  comment_id: integer("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  read_at: timestamp("read_at"),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (t) => ({
  userIdx: index("notif_user_idx").on(t.user_id),
  issueIdx: index("notif_issue_idx").on(t.issue_id),
  createdIdx: index("notif_created_idx").on(t.created_at)
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.user_id], references: [users.id], relationName: "notification_user" }),
  actor: one(users, { fields: [notifications.actor_id], references: [users.id], relationName: "notification_actor" }),
  issue: one(issues, { fields: [notifications.issue_id], references: [issues.id], relationName: "notification_issue" }),
  comment: one(comments, { fields: [notifications.comment_id], references: [comments.id], relationName: "notification_comment" })
}));

export type Notification = InferSelectModel<typeof notifications>;
export type NotificationInsert = InferInsertModel<typeof notifications>;
