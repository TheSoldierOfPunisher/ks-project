import { getIssueComments } from "~/actions/comment.action";
import { CommentItem } from "./comment-item";

export async function CommentList({
  issueId,
  pathname,
  renderMarkdownAction
}: {
  issueId: number;
  pathname: string;
  renderMarkdownAction: (
    content: string,
    repositoryPath: `${string}/${string}`
  ) => Promise<React.JSX.Element>;
}) {
  const comments = await getIssueComments(issueId);

  return (
    <div className="flex flex-col gap-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          pathname={pathname}
          renderMarkdownAction={renderMarkdownAction}
        />
      ))}
    </div>
  );
}
