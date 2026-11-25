CREATE INDEX `account_provider_account_idx` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `legal_acceptances_user_doc_ver_uidx` ON `legal_acceptances` (`user_id`,`document`,`version`);--> statement-breakpoint
CREATE INDEX `proposals_user_status_exp_idx` ON `proposals` (`user_id`,`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `proposals_expires_idx` ON `proposals` (`expires_at`);--> statement-breakpoint
CREATE INDEX `reviews_user_exam_due_idx` ON `reviews` (`user_id`,`exam_id`,`due_date`);--> statement-breakpoint
CREATE INDEX `session_expires_idx` ON `session` (`expires_at`);--> statement-breakpoint
CREATE INDEX `sync_mutations_user_applied_idx` ON `sync_mutations` (`user_id`,`applied_at`);--> statement-breakpoint
CREATE INDEX `tracking_consents_user_decided_idx` ON `tracking_consents` (`user_id`,`decided_at`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_uidx` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_expires_idx` ON `verification` (`expires_at`);