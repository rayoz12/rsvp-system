ALTER TABLE `invitees` RENAME TO `invitees_old`;--> statement-breakpoint
CREATE TABLE "invitees" (
	"id"	text NOT NULL,
	"name"	text NOT NULL,
	"view_count"	integer NOT NULL DEFAULT 0,
	"nuptials_response"	integer,
	"plus1_name"	text,
	"dietary_requirements"	text,
	"extra_song"	text,
	"plus1_enabled"	integer NOT NULL,
	"plus1_response"	integer,
	"reception_response"	integer,
	"indian_response_enabled"	integer NOT NULL,
	"nuptials_response_enabled"	integer NOT NULL,
	"reception_response_enabled"	integer NOT NULL,
	"indian_response"	integer,
	"plus1_link"	text,
    "groups" text DEFAULT (json_array()),
	PRIMARY KEY("id")
);--> statement-breakpoint
INSERT INTO invitees ("id", "name", "view_count", "nuptials_response", "plus1_name", "dietary_requirements", "extra_song", "plus1_enabled", "plus1_response", "reception_response", "indian_response_enabled", "nuptials_response_enabled", "reception_response_enabled", "indian_response", "plus1_link") SELECT "id", "name", "view_count", "nuptials_response", "plus1_name", "dietary_requirements", "extra_song", "plus1_enabled", "plus1_response", "reception_response", "indian_response_enabled", "nuptials_response_enabled", "reception_response_enabled", "indian_response", "plus1_link" FROM invitees_old;--> statement-breakpoint
drop TABLE invitees_old;
