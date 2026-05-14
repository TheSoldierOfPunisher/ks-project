import { toggleReaction } from "~/actions/comment.action";
import type { ReactionType } from "~/lib/server/db/schema/reaction.sql";

const reactionOptions = [
  { type: "PLUS_ONE", label: "+1", emoji: "👍" },
  { type: "MINUS_ONE", label: "-1", emoji: "👎" },
  { type: "LAUGH", label: "Laugh", emoji: "😄" },
  { type: "CONFUSED", label: "Confused", emoji: "😕" },
  { type: "HEART", label: "Heart", emoji: "❤️" },
  { type: "HOORAY", label: "Hooray", emoji: "🎉" },
  { type: "EYES", label: "Eyes", emoji: "👀" },
  { type: "ROCKET", label: "Rocket", emoji: "🚀" }
] satisfies Array<{ type: ReactionType; label: string; emoji: string }>;

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
      {reactionOptions.map(({ type, label, emoji }) => {
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
              aria-label={`Toggle ${label} reaction. ${count} reactions.`}
              className="rounded-full border border-neutral px-2 py-1 text-xs transition hover:bg-neutral/50 focus:outline-none focus:ring-2 focus:ring-accent"
              title={reactionUsers || `${count} ${label} reactions`}
              type="submit"
            >
              <span aria-hidden="true">{emoji}</span> {count}
            </button>
          </form>
        );
      })}
    </div>
  );
}
