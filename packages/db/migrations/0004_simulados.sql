CREATE TABLE `mock_exams` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`version` integer NOT NULL,
	`exam_id` text NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`lap` integer NOT NULL,
	`subjects` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mock_exams_user_version_idx` ON `mock_exams` (`user_id`,`version`);--> statement-breakpoint
ALTER TABLE `reviews` ADD `shifted_by_session_id` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `shift_days` integer;