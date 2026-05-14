"use client";

import * as React from "react";
import {
  createComment,
  searchMentionUsers,
  updateComment
} from "~/actions/comment.action";
import { Button } from "~/components/button";
import { MarkdownEditor } from "~/components/markdown-editor/markdown-editor";

export function CommentForm({
  issueId,
  pathname,
  renderMarkdownAction,
  mode = "create",
  comment
}: {
  issueId: number;
  pathname: string;
  renderMarkdownAction: (
    content: string,
    repositoryPath: `${string}/${string}`
  ) => Promise<React.JSX.Element>;
  mode?: "create" | "edit";
  comment?: any;
}) {
  const [isEditing, setEditing] = React.useState(mode === "create");
  const [error, setError] = React.useState<string | null>(null);
  const [optimisticContent, setOptimisticContent] = React.useState<
    string | null
  >(null);
  const [isPending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  if (mode === "edit" && !isEditing) {
    return (
      <Button type="button" onClick={() => setEditing(true)} variant="ghost">
        Edit
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const content = String(formData.get("content") ?? "");
        setError(null);
        setOptimisticContent(content);
        startTransition(async () => {
          try {
            if (mode === "create") {
              await createComment(issueId, content, pathname);
              formRef.current?.reset();
            } else {
              await updateComment(comment.id, content, pathname);
              setEditing(false);
            }
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Unable to save comment"
            );
          } finally {
            setOptimisticContent(null);
          }
        });
      }}
      className="mt-3"
    >
      {optimisticContent ? (
        <div className="mb-2 rounded-md border border-neutral bg-subtle p-2 text-sm text-grey">
          Saving “{optimisticContent.slice(0, 80)}…”
        </div>
      ) : null}
      {error ? (
        <p
          className="mb-2 rounded-md border border-danger p-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <MarkdownEditor
        name="content"
        label="Comment"
        defaultValue={comment?.content ?? ""}
        renderMarkdownAction={renderMarkdownAction}
        mentionSuggestionsAction={searchMentionUsers}
        required
      />
      <div className="mt-2 flex justify-end gap-2">
        {mode === "edit" ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        ) : null}
        <Button type="submit" aria-disabled={isPending} disabled={isPending}>
          {mode === "create" ? "Comment" : "Save"}
        </Button>
      </div>
    </form>
  );
}
