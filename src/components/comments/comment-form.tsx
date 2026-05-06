"use client";
import * as React from "react";
import { MarkdownEditor } from "~/components/markdown-editor/markdown-editor";
import { createComment, updateComment } from "~/actions/comment.action";
import { Button } from "~/components/button";

export function CommentForm({ issueId, pathname, renderMarkdownAction, mode = "create", comment }: { issueId: number; pathname: string; renderMarkdownAction: (content: string, repositoryPath: `${string}/${string}`) => Promise<React.JSX.Element>; mode?: "create" | "edit"; comment?: any }) {
  const [isEditing, setEditing] = React.useState(mode === "create");
  if (mode === "edit" && !isEditing) return <Button type="button" onClick={() => setEditing(true)} variant="ghost">Edit</Button>;
  return <form action={async (formData) => {
    const content = String(formData.get("content") ?? "");
    if (mode === "create") await createComment(issueId, content, pathname); else await updateComment(comment.id, content, pathname);
    setEditing(false);
  }} className="mt-3">
    <MarkdownEditor name="content" label="Comment" defaultValue={comment?.content ?? ""} renderMarkdownAction={renderMarkdownAction} required />
    <div className="mt-2 flex justify-end"><Button type="submit">{mode === "create" ? "Comment" : "Save"}</Button></div>
  </form>;
}
