CREATE TABLE `api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`last_used` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`emoji` text DEFAULT '🐔' NOT NULL,
	`pin_hash` text DEFAULT '' NOT NULL,
	`pin_plain` text DEFAULT '0000' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_excluded` integer DEFAULT false NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `folders_name_unique` ON `folders` (`name`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`folder_id` integer NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`storage_path` text NOT NULL,
	`thumbnail_path` text,
	`checksum` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`width` integer,
	`height` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`pin_hash` text NOT NULL,
	`email` text DEFAULT '',
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);