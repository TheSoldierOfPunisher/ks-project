import { getAuthedUser } from "~/actions/auth.action";
import {
  getIssueComments,
  getIssueSubscription,
  toggleIssueSubscription
} from "~/actions/comment.action";
import { Button } from "~/components/button";
import { CommentItem } from "./comment-item";

export async function CommentList({
  issueId,
  pathname,
  page = 1,
  renderMarkdownAction
}: {
  issueId: number;
  pathname: string;
  page?: number;
  renderMarkdownAction: (
    content: string,
    repositoryPath: `${string}/${string}`
  ) => Promise<React.JSX.Element>;
}) {
  const [data, currentUser, isSubscribed] = await Promise.all([
    getIssueComments(issueId, page),
    getAuthedUser(),
    getIssueSubscription(issueId)
  ]);

  const getPageHref = (targetPage: number) => {
    const url = new URL(pathname, "https://local.test");
    url.searchParams.set("commentsPage", String(targetPage));
    return `${url.pathname}${url.search}#comments`;
  };

  return (
    <div id="comments" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-grey">
          {data.total} comment{data.total === 1 ? "" : "s"}
        </p>
        {currentUser ? (
          <form action={toggleIssueSubscription.bind(null, issueId, pathname)}>
            <Button
              type="submit"
              variant={isSubscribed ? "ghost" : "secondary"}
            >
              {isSubscribed ? "Unsubscribe" : "Subscribe"}
            </Button>
          </form>
        ) : null}
      </div>

      {data.comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUser?.id}
          pathname={pathname}
          renderMarkdownAction={renderMarkdownAction}
        />
      ))}

      {data.pageCount > 1 ? (
        <nav
          className="flex items-center justify-center gap-2"
          aria-label="Comment pagination"
        >
          <Button
            href={getPageHref(Math.max(1, data.page - 1))}
            variant="ghost"
            aria-disabled={data.page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-grey">
            Page {data.page} of {data.pageCount}
          </span>
          <Button
            href={getPageHref(Math.min(data.pageCount, data.page + 1))}
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
