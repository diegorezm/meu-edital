CREATE TABLE `sync_mutations` (
	`user_id` text NOT NULL,
	`mutation_id` text NOT NULL,
	`applied_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `mutation_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sync_mutations_applied_idx` ON `sync_mutations` (`applied_at`);