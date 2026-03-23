CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`author_name` text DEFAULT '匿名',
	`author_ip` text,
	`title` text NOT NULL,
	`description` text DEFAULT '',
	`type` text DEFAULT 'feature',
	`status` text DEFAULT 'open',
	`upvotes` integer DEFAULT 0,
	`images` text DEFAULT '[]',
	`is_converted` integer DEFAULT false,
	`issue_id` integer,
	`avatar_url` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `feedback_replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feedback_id` integer NOT NULL,
	`author_name` text DEFAULT '匿名',
	`author_ip` text,
	`is_owner` integer DEFAULT false,
	`content` text NOT NULL,
	`images` text DEFAULT '[]',
	`avatar_url` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `feedback_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feedback_id` integer NOT NULL,
	`voter_ip` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `issue_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`issue_id` integer NOT NULL,
	`author_name` text DEFAULT '匿名',
	`author_ip` text,
	`is_owner` integer DEFAULT false,
	`content` text NOT NULL,
	`images` text DEFAULT '[]',
	`avatar_url` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `issue_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`issue_id` integer NOT NULL,
	`voter_ip` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '',
	`status` text DEFAULT 'planned',
	`date` text NOT NULL,
	`icon` text DEFAULT 'milestone',
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `releases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`version` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`download_url` text,
	`published_at` text DEFAULT (datetime('now')),
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `readme` text DEFAULT '';