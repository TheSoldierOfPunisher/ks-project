import { toggleReaction } from "~/actions/comment.action";
import type { ReactionType } from "~/lib/server/db/schema/reaction.sql";

const reactionOptions = [
  { type: "PLUS_ONE", label: "+1" },
  { type: "MINUS_ONE", label: "-1" },
  { type: "LAUGH", label: "Laugh" },
  { type: "CONFUSED", label: "Confused" },
  { type: "HEART", label: "Heart" },
  { type: "HOORAY", label: "Hooray" },
  { type: "EYES", label: "Eyes" },
  { type: "ROCKET", label: "Rocket" }
] satisfies Array<{ type: ReactionType; label: string }>;

type CommentReaction = {
  type: ReactionType;
  author?: {
    username: string;
  } | null;
};

type CommentWithReactions = {
  id: number;
  reactions?: CommentReaction[] | null;
};

export function CommentReactions({
  comment,
  pathname
}: {
  comment: CommentWithReactions;
  pathname: string;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Comment reactions">
      {reactionOptions.map(({ type, label }) => {
        const users =
          comment.reactions?.filter((reaction) => reaction.type === type) ?? [];
        const count = users.length;
        const reactionUsers = users
          .map((reaction) => reaction.author?.username)
          .filter(Boolean)
          .join(", ");

        return (
          <form
            key={type}
            action={toggleReaction.bind(null, comment.id, type, pathname)}
          >
            <button
              aria-label={`Toggle ${label} reaction`}
              className="rounded-full border border-neutral px-2 py-1 text-xs transition hover:bg-neutral/50"
              title={reactionUsers || `${count} ${label} reactions`}
              type="submit"
            >
              {label} {count}
            </button>
          </form>
        );
      })}
    </div>
  );
}