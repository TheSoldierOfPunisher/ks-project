"use client";
import { toggleReaction } from "~/actions/comment.action";

const options = ["PLUS_ONE", "MINUS_ONE", "LAUGH", "CONFUSED", "HEART", "HOORAY", "EYES", "ROCKET"] as const;

export function CommentReactions({ comment }: { comment: any }) {
  return <div className="mt-3 flex flex-wrap gap-2">{options.map((type) => {
    const count = comment.reactions?.filter((r: any) => r.type === type).length ?? 0;
    return <form key={type} action={() => toggleReaction(comment.id, type)}><button aria-label={`Toggle ${type} reaction`} className="text-xs border border-neutral rounded-full px-2 py-1" type="submit">{type} {count}</button></form>;
  })}</div>;
}
