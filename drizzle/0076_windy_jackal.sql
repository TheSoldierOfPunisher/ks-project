DO $$ BEGIN
 CREATE TYPE "notification_type" AS ENUM('MENTION', 'NEW_COMMENT', 'ISSUE_STATUS_CHANGED', 'ASSIGNED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gh_next_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"actor_id" integer,
	"issue_id" integer,
	"comment_id" integer,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notif_user_idx" ON "gh_next_notifications" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notif_issue_idx" ON "gh_next_notifications" ("issue_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notif_created_idx" ON "gh_next_notifications" ("created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gh_next_notifications" ADD CONSTRAINT "gh_next_notifications_user_id_gh_next_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "gh_next_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gh_next_notifications" ADD CONSTRAINT "gh_next_notifications_actor_id_gh_next_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "gh_next_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gh_next_notifications" ADD CONSTRAINT "gh_next_notifications_issue_id_gh_next_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "gh_next_issues"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gh_next_notifications" ADD CONSTRAINT "gh_next_notifications_comment_id_gh_next_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "gh_next_comments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
