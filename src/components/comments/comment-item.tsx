import {
  deleteComment,
  restoreComment,
  hideComment,
  unhideComment
} from "~/actions/comment.action";
import { Avatar } from "~/components/avatar";
import { Button } from "~/components/button";
import { Markdown } from "~/components/markdown/markdown";
import { CacheKeys } from "~/lib/shared/cache-keys.shared";
import type { CommentHideReason } from "~/lib/server/db/schema/comment.sql";
import { CommentForm } from "./comment-form";
import { CommentHistory } from "./comment-history";
import { CommentReactions } from "./comment-reactions";

const hideReasons = [
  "ABUSE",
  "OFF_TOPIC",
  "OUTDATED",
  "RESOLVED",
  "DUPLICATE",
  "SPAM"
] satisfies CommentHideReason[];

export function CommentItem({
  comment,
  pathname,
  currentUserId,
  renderMarkdownAction
}: {
  comment: any;
  pathname: string;
  currentUserId?: number | null;
  renderMarkdownAction: (
    content: string,
    repositoryPath: `${string}/${string}`
  ) => Promise<React.JSX.Element>;
}) {
  const isAuthor = currentUserId === comment.author_id;
  const isEdited =
    comment.revisions?.length ||
    new Date(comment.updated_at).getTime() !==
      new Date(comment.created_at).getTime();

  return (
    <article
      id={`comment-${comment.id}`}
      className="scroll-mt-20 rounded-md border border-neutral p-4"
      aria-labelledby={`comment-${comment.id}-author`}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-grey">
        <div className="flex items-center gap-2">
          <Avatar
            src={comment.author_avatar_url}
            username={comment.author_username}
            size="small"
          />
          <span id={`comment-${comment.id}-author`} className="font-semibold">
            @{comment.author_username}
          </span>
          <a href={`#comment-${comment.id}`} className="underline">
            {new Date(comment.created_at).toLocaleString()}
          </a>
          {isEdited ? (
            <span
              title={`Last edited ${new Date(comment.updated_at).toLocaleString()}`}
            >
              · edited
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`#comment-${comment.id}`}
            className="rounded-md px-2 py-1 underline focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Permalink
          </a>
          <a
            href={`#comment-${comment.id}`}
            className="rounded-md px-2 py-1 underline focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Quote
          </a>
        </div>
      </header>

      {comment.deleted_at ? (
        <div className="rounded-md border border-neutral bg-subtle p-3 text-sm text-grey">
          This comment was deleted.
        </div>
      ) : comment.hidden ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
          This comment was hidden by moderators. Reason: {comment.hidden_reason}
          .
        </div>
      ) : (
        <Markdown
          cacheKey={CacheKeys.comment({
            id: comment.id,
            updatedAt: comment.updated_at
          })}
          content={comment.content}
        />
      )}

      <CommentHistory revisions={comment.revisions} />
      <CommentReactions comment={comment} pathname={pathname} />

      <div className="mt-3 flex flex-wrap gap-2">
        {isAuthor ? (
          <>
            <CommentForm
              issueId={comment.issue_id}
              pathname={pathname}
              renderMarkdownAction={renderMarkdownAction}
              mode="edit"
              comment={comment}
            />
            {comment.deleted_at ? (
              <form action={restoreComment.bind(null, comment.id, pathname)}>
                <Button type="submit" variant="ghost">
                  Restore
                </Button>
              </form>
            ) : (
              <form action={deleteComment.bind(null, comment.id, pathname)}>
                <Button type="submit" variant="danger">
                  Delete
                </Button>
              </form>
            )}
          </>
        ) : null}

        {comment.hidden ? (
          <form action={unhideComment.bind(null, comment.id, pathname)}>
            <Button type="submit" variant="ghost">
              Restore visibility
            </Button>
          </form>
        ) : null}
        {!comment.hidden && !comment.deleted_at ? (
          <form
            action={async (formData) => {
              "use server";
              const reason = String(
                formData.get("reason")
              ) as CommentHideReason;
              await hideComment(comment.id, reason, pathname);
            }}
            className="flex gap-2"
          >
            <select
              aria-label="Reason to hide comment"
              className="rounded-md border border-neutral bg-backdrop px-2 text-sm"
              name="reason"
              defaultValue="OFF_TOPIC"
            >
              {hideReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason.replaceAll("_", " ").toLowerCase()}
                </option>
              ))}
            </select>
            <Button type="submit" variant="ghost">
              Hide
            </Button>
          </form>
        ) : null}
      </div>
    </article>
  );
}
