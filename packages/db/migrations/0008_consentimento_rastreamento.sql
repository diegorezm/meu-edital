CREATE TABLE `tracking_consents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category` text NOT NULL,
	`granted` integer NOT NULL,
	`policy_version` text NOT NULL,
	`decided_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tracking_consents_user_idx` ON `tracking_consents` (`user_id`,`category`);