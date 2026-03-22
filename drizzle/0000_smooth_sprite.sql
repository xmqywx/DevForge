CREATE TABLE `git_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`branch` text,
	`last_commit_hash` text,
	`last_commit_msg` text,
	`last_commit_date` text,
	`is_dirty` integer DEFAULT false,
	`ahead` integer DEFAULT 0,
	`behind` integer DEFAULT 0,
	`total_commits` integer DEFAULT 0,
	`scanned_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '',
	`type` text DEFAULT 'task',
	`status` text DEFAULT 'open',
	`priority` text DEFAULT 'medium',
	`source` text DEFAULT 'manual',
	`feedback_id` integer,
	`depends_on` text DEFAULT '[]',
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	`resolved_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '',
	`source` text DEFAULT 'manual',
	`session_id` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`icon` text DEFAULT '📦',
	`stage` text DEFAULT 'idea',
	`progress_pct` integer DEFAULT 0,
	`progress_phase` text DEFAULT '',
	`priority` text DEFAULT 'medium',
	`tags` text DEFAULT '[]',
	`repo_path` text,
	`github_url` text,
	`website_url` text,
	`is_public` integer DEFAULT false,
	`auto_record_issues` text DEFAULT 'default',
	`auto_record_notes` text DEFAULT 'default',
	`auto_session_summary` text DEFAULT 'default',
	`auto_load_context` text DEFAULT 'default',
	`auto_update_progress` text DEFAULT 'default',
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
