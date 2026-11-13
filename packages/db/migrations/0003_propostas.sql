CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam_id` text NOT NULL,
	`source` text NOT NULL,
	`author` text NOT NULL,
	`reason` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `proposals_user_status_idx` ON `proposals` (`user_id`,`status`);