ALTER TABLE `invitees` RENAME COLUMN `response` TO `nuptials_response`;--> statement-breakpoint
ALTER TABLE invitees ADD `reception_response` integer;