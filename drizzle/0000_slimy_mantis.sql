CREATE TABLE `invitees` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`response` integer,
	`plus1_name` text,
	`dietary_requirements` text,
	`extra_song` text
);
