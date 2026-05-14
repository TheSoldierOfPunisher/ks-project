import { Markdown } from "~/components/markdown/markdown";
import { CommentForm } from "./comment-form";
import { CommentReactions } from "./comment-reactions";

export function CommentItem({
  comment,
  pathname,
  renderMarkdownAction
}: {
  comment: any;
  pathname: string;
  renderMarkdownAction: (
    content: string,
    repositoryPath: `${string}/${string}`
  ) => Promise<React.JSX.Element>;
}) {
  return (
    <article
      id={`comment-${comment.id}`}
      className="border border-neutral rounded-md p-4"
    >
      <header className="text-xs text-grey mb-2">
        @{comment.author_username} ·{" "}
        {new Date(comment.created_at).toLocaleString()}{" "}
        {comment.revisions?.length ? "· edited" : ""}
      </header>
      <Markdown content={comment.content} />
      <CommentReactions comment={comment} pathname={pathname} />
      <CommentForm
        issueId={comment.issue_id}
        pathname={pathname}
        renderMarkdownAction={renderMarkdownAction}
        mode="edit"
        comment={comment}
      />
    </article>
  );
}