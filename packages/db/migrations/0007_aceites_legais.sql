CREATE TABLE `legal_acceptances` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`document` text NOT NULL,
	`version` text NOT NULL,
	`accepted_at` integer NOT NULL,
	`ip_hash` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `legal_acceptances_user_idx` ON `legal_acceptances` (`user_id`,`document`);