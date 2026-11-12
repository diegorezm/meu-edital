CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `cycle_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`version` integer NOT NULL,
	`exam_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`minutes` integer NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cycle_items_user_version_idx` ON `cycle_items` (`user_id`,`version`);--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`version` integer NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`board` text,
	`exam_date` text,
	`hours_per_week` real NOT NULL,
	`created_at` text NOT NULL,
	`cycle_position` integer DEFAULT 0 NOT NULL,
	`cycle_laps` integer DEFAULT 0 NOT NULL,
	`last_cycle_session_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exams_user_version_idx` ON `exams` (`user_id`,`version`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`version` integer NOT NULL,
	`exam_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`session_id` text NOT NULL,
	`due_date` text NOT NULL,
	`stage` integer NOT NULL,
	`completed_by_session_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reviews_user_version_idx` ON `reviews` (`user_id`,`version`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`version` integer NOT NULL,
	`exam_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`cycle_item_id` text,
	`type` text NOT NULL,
	`minutes` integer NOT NULL,
	`date` text NOT NULL,
	`questions` integer,
	`correct` integer,
	`note` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `study_sessions_user_version_idx` ON `study_sessions` (`user_id`,`version`);--> statement-breakpoint
CREATE INDEX `study_sessions_user_date_idx` ON `study_sessions` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`version` integer NOT NULL,
	`exam_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`weight` real,
	`questions` integer,
	`points_per_question` real,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subjects_user_version_idx` ON `subjects` (`user_id`,`version`);--> statement-breakpoint
CREATE TABLE `sync_counters` (
	`user_id` text PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`version` integer NOT NULL,
	`subject_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `topics_user_version_idx` ON `topics` (`user_id`,`version`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`version` integer NOT NULL,
	`active_exam_id` text,
	`review_offsets` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_settings_user_version_idx` ON `user_settings` (`user_id`,`version`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `week_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`version` integer NOT NULL,
	`exam_id` text NOT NULL,
	`week_start` text NOT NULL,
	`total_minutes` integer NOT NULL,
	`subjects` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `week_targets_user_version_idx` ON `week_targets` (`user_id`,`version`);