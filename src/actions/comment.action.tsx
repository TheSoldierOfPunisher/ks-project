"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "~/lib/server/db/index.server";
import { comments, commentRevisions } from "~/lib/server/db/schema/comment.sql";
import { reactions } from "~/lib/server/db/schema/reaction.sql";
import { issueUserMentions } from "~/lib/server/db/schema/mention.sql";
import { notifications } from "~/lib/server/db/schema/notification.sql";
import { users } from "~/lib/server/db/schema/user.sql";
import { getAuthedUser } from "./auth.action";
import { revalidatePath } from "next/cache";

const mentionRegex = /(^|\s)@([a-zA-Z0-9_-]+)/g;

export async function getIssueComments(issueId: number) {
  const rows = await db.query.comments.findMany({
    where: and(eq(comments.issue_id, issueId), eq(comments.hidden, false)),
    orderBy: [desc(comments.created_at)],
    with: { revisions: true, reactions: true }
  });

  return rows;
}

export async function createComment(issueId: number, content: string, pathname: string) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");

  const [created] = await db.insert(comments).values({
    issue_id: issueId,
    content,
    author_id: user.id,
    author_username: user.username,
    author_avatar_url: user.avatar_url
  }).returning();

  await persistMentionsAndNotifications(content, issueId, created.id, user.id);
  revalidatePath(pathname);
  return created;
}

export async function updateComment(commentId: number, content: string, pathname: string) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");

  const current = await db.query.comments.findFirst({ where: eq(comments.id, commentId) });
  if (!current || current.author_id !== user.id) throw new Error("Forbidden");

  await db.insert(commentRevisions).values({ comment_id: commentId, updated_content: current.content });
  await db.update(comments).set({ content }).where(eq(comments.id, commentId));
  revalidatePath(pathname);
}

export async function deleteComment(commentId: number, pathname: string) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");
  const current = await db.query.comments.findFirst({ where: eq(comments.id, commentId) });
  if (!current || current.author_id !== user.id) throw new Error("Forbidden");
  await db.update(comments).set({ hidden: true, hidden_reason: "RESOLVED" }).where(eq(comments.id, commentId));
  revalidatePath(pathname);
}

export async function toggleReaction(commentId: number, reactionType: any) {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");
  const existing = await db.query.reactions.findFirst({ where: and(eq(reactions.comment_id, commentId), eq(reactions.author_id, user.id), eq(reactions.type, reactionType)) });
  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
    return;
  }
  await db.insert(reactions).values({ comment_id: commentId, author_id: user.id, type: reactionType });
}

async function persistMentionsAndNotifications(content: string, issueId: number, commentId: number, actorId: number) {
  const usernames = Array.from(new Set(Array.from(content.matchAll(mentionRegex)).map((m) => m[2].toLowerCase())));
  if (!usernames.length) return;
  const mentionedUsers = await db.select().from(users).where(sql`LOWER(${users.username}) IN ${usernames}`);

  for (const mentioned of mentionedUsers) {
    await db.insert(issueUserMentions).values({ username: mentioned.username, issue_id: issueId, comment_id: commentId }).onConflictDoNothing();
    if (mentioned.id !== actorId) {
      await db.insert(notifications).values({
        user_id: mentioned.id,
        actor_id: actorId,
        issue_id: issueId,
        comment_id: commentId,
        type: "MENTION",
        title: "You were mentioned in a comment",
        body: content.slice(0, 160)
      });
    }
  }
}
