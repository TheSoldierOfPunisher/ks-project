"use client";

import * as React from "react";
import { Avatar } from "~/components/avatar";
import { setFieldText } from "text-field-edit";

type MentionUser = {
  id: number;
  username: string;
  avatar_url: string;
  name: string | null;
};

export function MentionAutocomplete({
  textareaRef,
  searchAction
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  searchAction?: (query: string) => Promise<MentionUser[]>;
}) {
  const [query, setQuery] = React.useState("");
  const [users, setUsers] = React.useState<MentionUser[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (!searchAction || query.length < 1) {
      setUsers([]);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const result = await searchAction(query);
      if (!cancelled) {
        setUsers(result);
        setActiveIndex(0);
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query, searchAction]);

  const insertMention = React.useCallback(
    (user: MentionUser) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const cursor = textarea.selectionStart;
      const beforeCursor = textarea.value.slice(0, cursor);
      const afterCursor = textarea.value.slice(cursor);
      const replacedBeforeCursor = beforeCursor.replace(
        /(^|\s)@([a-zA-Z0-9_-]*)$/,
        `$1@${user.username} `
      );
      const value = replacedBeforeCursor + afterCursor;
      setFieldText(textarea, value);
      textarea.focus();
      textarea.setSelectionRange(
        replacedBeforeCursor.length,
        replacedBeforeCursor.length
      );
      setUsers([]);
    },
    [textareaRef]
  );

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    function updateQuery() {
      const target = textareaRef.current;
      if (!target) return;
      const cursor = target.selectionStart;
      const beforeCursor = target.value.slice(0, cursor);
      const match = beforeCursor.match(/(^|\s)@([a-zA-Z0-9_-]*)$/);
      setQuery(match?.[2] ?? "");
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!users.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % users.length);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + users.length) % users.length);
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertMention(users[activeIndex]);
      }
      if (event.key === "Escape") {
        setUsers([]);
      }
    }

    textarea.addEventListener("input", updateQuery);
    textarea.addEventListener("click", updateQuery);
    textarea.addEventListener("keyup", updateQuery);
    textarea.addEventListener("keydown", handleKeyDown);
    return () => {
      textarea.removeEventListener("input", updateQuery);
      textarea.removeEventListener("click", updateQuery);
      textarea.removeEventListener("keyup", updateQuery);
      textarea.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, insertMention, textareaRef, users]);

  if (!users.length) return null;

  return (
    <div
      role="listbox"
      aria-label="Mention suggestions"
      className="absolute z-20 mt-2 max-h-64 w-72 overflow-auto rounded-md border border-neutral bg-backdrop p-1 shadow-lg"
    >
      {users.map((user, index) => (
        <button
          key={user.id}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-subtle aria-selected:bg-subtle"
          onMouseDown={(event) => {
            event.preventDefault();
            insertMention(user);
          }}
        >
          <Avatar src={user.avatar_url} username={user.username} size="small" />
          <span>
            <span className="font-semibold">@{user.username}</span>
            {user.name ? (
              <span className="text-grey"> · {user.name}</span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}
