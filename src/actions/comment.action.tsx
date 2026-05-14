"use server";

import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "~/lib/server/db/index.server";
import {
  comments,
  commentRevisions,
  type CommentHideReason
} from "~/lib/server/db/schema/comment.sql";
import {
  issueUserSubscriptions,
  issues
} from "~/lib/server/db/schema/issue.sql";
import { issueUserMentions } from "~/lib/server/db/schema/mention.sql";
import { notifications } from "~/lib/server/db/schema/notification.sql";
import {
  reactions,
  type ReactionType
} from "~/lib/server/db/schema/reaction.sql";
import { users } from "~/lib/server/db/schema/user.sql";
import { getAuthedUser } from "./auth.action";

const COMMENT_PAGE_SIZE = 10;
const mentionRegex = /(^|\s)@([a-zA-Z0-9_-]+)/g;

export async function getIssueComments(issueId: number, page = 1) {
  const safePage = Math.max(1, page);
  const whereClause = eq(comments.issue_id, issueId);

  const [rows, countResult] = await Promise.all([
    db.query.comments.findMany({
      where: whereClause,
      orderBy: [asc(comments.created_at)],
      limit: COMMENT_PAGE_SIZE,
      offset: (safePage - 1) * COMMENT_PAGE_SIZE,
      with: {
        revisions: {
          orderBy: [desc(commentRevisions.created_at)]
        },
        reactions: {
          with: { author: true }
        }
      }
    }),
    db
      .select({ value: sql<number>`count(*)`.mapWith(Number) })
      .from(comments)
      .where(whereClause)
  ]);

  return {
    comments: rows,
    page: safePage,
    pageSize: COMMENT_PAGE_SIZE,
    total: countResult[0]?.value ?? 0,
    pageCount: Math.max(
      1,
      Math.ceil((countResult[0]?.value ?? 0) / COMMENT_PAGE_SIZE)
    )
  };
}

export async function createComment(
  issueId: number,
  content: string,
  pathname: string
) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");

  const sanitizedContent = content.trim();
  if (!sanitizedContent) throw new Error("Comment cannot be empty");

  const [created] = await db
    .insert(comments)
    .values({
      issue_id: issueId,
      content: sanitizedContent,
      author_id: user.id,
      author_username: user.username,
      author_avatar_url: user.avatar_url
    })
    .returning();

  await subscribeToIssue(issueId, user.id);
  await persistMentionsAndNotifications(
    sanitizedContent,
    issueId,
    created.id,
    user.id,
    "comment"
  );
  await notifyIssueSubscribers(issueId, created.id, user.id, sanitizedContent);
  revalidatePath(pathname);
  return created;
}

export async function updateComment(
  commentId: number,
  content: string,
  pathname: string
) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");

  const sanitizedContent = content.trim();
  if (!sanitizedContent) throw new Error("Comment cannot be empty");

  const current = await db.query.comments.findFirst({
    where: and(eq(comments.id, commentId), isNull(comments.deleted_at))
  });
  if (!current || current.author_id !== user.id) throw new Error("Forbidden");

  if (current.content === sanitizedContent) return;

  await db.insert(commentRevisions).values({
    comment_id: commentId,
    updated_content: current.content,
    revised_by_username: user.username,
    revised_by_avatar_url: user.avatar_url
  });
  await db
    .update(comments)
    .set({ content: sanitizedContent, updated_at: new Date() })
    .where(eq(comments.id, commentId));
  await persistMentionsAndNotifications(
    sanitizedContent,
    current.issue_id,
    commentId,
    user.id,
    "comment"
  );
  revalidatePath(pathname);
}

export async function deleteComment(commentId: number, pathname: string) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");
  const current = await db.query.comments.findFirst({
    where: eq(comments.id, commentId)
  });
  if (!current || current.author_id !== user.id) throw new Error("Forbidden");
  await db
    .update(comments)
    .set({ deleted_at: new Date() })
    .where(eq(comments.id, commentId));
  revalidatePath(pathname);
}

export async function restoreComment(commentId: number, pathname: string) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");
  const current = await db.query.comments.findFirst({
    where: eq(comments.id, commentId)
  });
  if (!current || current.author_id !== user.id) throw new Error("Forbidden");
  await db
    .update(comments)
    .set({ deleted_at: null })
    .where(eq(comments.id, commentId));
  revalidatePath(pathname);
}

export async function hideComment(
  commentId: number,
  reason: CommentHideReason,
  pathname: string
) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");
  await db
    .update(comments)
    .set({ hidden: true, hidden_reason: reason })
    .where(eq(comments.id, commentId));
  revalidatePath(pathname);
}

export async function unhideComment(commentId: number, pathname: string) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");
  await db
    .update(comments)
    .set({ hidden: false, hidden_reason: null })
    .where(eq(comments.id, commentId));
  revalidatePath(pathname);
}

export async function toggleReaction(
  commentId: number,
  reactionType: ReactionType,
  pathname: string
) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");

  const comment = await db.query.comments.findFirst({
    where: and(eq(comments.id, commentId), isNull(comments.deleted_at))
  });
  if (!comment) throw new Error("Comment not found");

  const existing = await db.query.reactions.findFirst({
    where: and(
      eq(reactions.comment_id, commentId),
      eq(reactions.author_id, user.id),
      eq(reactions.type, reactionType)
    )
  });

  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
  } else {
    await db.insert(reactions).values({
      comment_id: commentId,
      author_id: user.id,
      type: reactionType
    });
  }

  revalidatePath(pathname);
}

export async function toggleIssueSubscription(
  issueId: number,
  pathname: string
) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");

  const existing = await db.query.issueUserSubscriptions.findFirst({
    where: and(
      eq(issueUserSubscriptions.issue_id, issueId),
      eq(issueUserSubscriptions.user_id, user.id)
    )
  });

  if (existing) {
    await db
      .delete(issueUserSubscriptions)
      .where(eq(issueUserSubscriptions.id, existing.id));
  } else {
    await subscribeToIssue(issueId, user.id);
  }

  revalidatePath(pathname);
}

export async function getIssueSubscription(issueId: number) {
  const user = await getAuthedUser();
  if (!user) return false;
  const subscription = await db.query.issueUserSubscriptions.findFirst({
    where: and(
      eq(issueUserSubscriptions.issue_id, issueId),
      eq(issueUserSubscriptions.user_id, user.id)
    )
  });
  return Boolean(subscription);
}

export async function searchMentionUsers(query: string) {
  const user = await getAuthedUser();
  if (!user) return [];
  const value = query.trim().replace(/^@/, "").toLowerCase();
  if (!value) return [];
  return db
    .select({
      id: users.id,
      username: users.username,
      avatar_url: users.avatar_url,
      name: users.name
    })
    .from(users)
    .where(sql`LOWER(${users.username}) LIKE ${`${value}%`}`)
    .limit(8);
}

async function subscribeToIssue(issueId: number, userId: number) {
  await db
    .insert(issueUserSubscriptions)
    .values({ issue_id: issueId, user_id: userId })
    .onConflictDoNothing();
}

async function notifyIssueSubscribers(
  issueId: number,
  commentId: number,
  actorId: number,
  content: string
) {
  const subscribers = await db
    .select({ user_id: issueUserSubscriptions.user_id })
    .from(issueUserSubscriptions)
    .where(
      and(
        eq(issueUserSubscriptions.issue_id, issueId),
        ne(issueUserSubscriptions.user_id, actorId)
      )
    );

  if (!subscribers.length) return;

  await db.insert(notifications).values(
    subscribers.map(({ user_id }) => ({
      user_id,
      actor_id: actorId,
      issue_id: issueId,
      comment_id: commentId,
      type: "NEW_COMMENT" as const,
      title: "New comment in an issue you follow",
      body: content.slice(0, 160)
    }))
  );
}

export async function createIssueMentionNotifications(
  issueId: number,
  content: string,
  actorId: number
) {
  await persistMentionsAndNotifications(
    content,
    issueId,
    null,
    actorId,
    "issue"
  );
}

export async function createIssueStatusNotification(
  issueId: number,
  actorId: number,
  status: string
) {
  await notifySubscribers(issueId, actorId, {
    type: "ISSUE_STATUS_CHANGED",
    title: `Issue status changed to ${status}`,
    body: `The issue is now ${status.toLowerCase()}.`
  });
}

export async function createIssueAssignmentNotification(
  issueId: number,
  actorId: number,
  assigneeUserId: number
) {
  if (actorId === assigneeUserId) return;
  await db.insert(notifications).values({
    user_id: assigneeUserId,
    actor_id: actorId,
    issue_id: issueId,
    type: "ASSIGNED",
    title: "You were assigned to an issue",
    body: "Open the issue to view the assignment."
  });
}

async function notifySubscribers(
  issueId: number,
  actorId: number,
  notification: {
    type: "ISSUE_STATUS_CHANGED";
    title: string;
    body: string;
  }
) {
  const subscribers = await db
    .select({ user_id: issueUserSubscriptions.user_id })
    .from(issueUserSubscriptions)
    .where(
      and(
        eq(issueUserSubscriptions.issue_id, issueId),
        ne(issueUserSubscriptions.user_id, actorId)
      )
    );

  if (!subscribers.length) return;

  await db.insert(notifications).values(
    subscribers.map(({ user_id }) => ({
      user_id,
      actor_id: actorId,
      issue_id: issueId,
      ...notification
    }))
  );
}

async function persistMentionsAndNotifications(
  content: string,
  issueId: number,
  commentId: number | null,
  actorId: number,
  source: "comment" | "issue"
) {
  const usernames = Array.from(
    new Set(
      Array.from(content.matchAll(mentionRegex)).map((m) => m[2].toLowerCase())
    )
  );
  if (!usernames.length) return;

  const mentionedUsers = await db
    .select()
    .from(users)
    .where(inArray(sql`LOWER(${users.username})`, usernames));

  for (const mentioned of mentionedUsers) {
    await db
      .insert(issueUserMentions)
      .values({
        username: mentioned.username,
        issue_id: issueId,
        comment_id: commentId
      })
      .onConflictDoNothing();
    if (mentioned.id !== actorId) {
      await db.insert(notifications).values({
        user_id: mentioned.id,
        actor_id: actorId,
        issue_id: issueId,
        comment_id: commentId,
        type: "MENTION",
        title: `You were mentioned in an ${source}`,
        body: content.slice(0, 160)
      });
    }
  }
}
