ALTER TABLE "gh_next_comments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "gh_next_comments" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
ALTER TABLE "gh_next_comment_revisions" ADD COLUMN IF NOT EXISTS "revised_by_username" varchar(255) DEFAULT 'unknown' NOT NULL;
ALTER TABLE "gh_next_comment_revisions" ADD COLUMN IF NOT EXISTS "revised_by_avatar_url" varchar(255) DEFAULT '' NOT NULL;

DO $$ BEGIN
 ALTER TABLE "gh_next_issue_user_subscriptions" ADD CONSTRAINT "issue_user_sub_unique_idx" UNIQUE ("issue_id", "user_id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
