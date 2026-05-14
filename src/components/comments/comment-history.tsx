import { Markdown } from "~/components/markdown/markdown";

type Revision = {
  id: number;
  created_at: Date;
  updated_content: string;
  revised_by_username?: string;
};

export function CommentHistory({
  revisions
}: {
  revisions?: Revision[] | null;
}) {
  if (!revisions?.length) return null;

  return (
    <details className="mt-3 rounded-md border border-neutral p-3 text-sm">
      <summary className="cursor-pointer font-medium">
        View edit history ({revisions.length})
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        {revisions.map((revision) => (
          <section key={revision.id} className="rounded-md bg-subtle p-3">
            <p className="mb-2 text-xs text-grey">
              Edited by @{revision.revised_by_username ?? "unknown"} on{" "}
              {new Date(revision.created_at).toLocaleString()}
            </p>
            <Markdown content={revision.updated_content} />
          </section>
        ))}
      </div>
    </details>
  );
}
