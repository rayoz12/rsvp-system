import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { and, eq, relations, sql } from 'drizzle-orm';

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}


function randomID() {
    const length = 6;
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let id = "";
    for (let i = 0; i < length; i++) {
        id += chars[getRandomArbitrary(0, chars.length)];
    }
    
    return id;
}

export const invitees = sqliteTable('invitees', {
    // Base / Config Details
    id: text('id').primaryKey().$defaultFn(randomID),
    name: text('name').notNull(),
    viewCount: integer("view_count").notNull().default(0),
    plus1Enabled: integer("plus1_enabled", {mode: 'boolean'}).notNull(), // If this user has the option to bring a plus1
    plus1Link: text("plus1_link"),
    indianResponseEnabled: integer("indian_response_enabled", {mode: 'boolean'}).notNull(), // If this user has the option to come to the indian wedding
    nuptialsResponseEnabled: integer("nuptials_response_enabled", {mode: 'boolean'}).notNull(), // If this user has the option to come to the nuptials
    receptionResponseEnabled: integer("reception_response_enabled", {mode: 'boolean'}).notNull(), // If this user has the option to come to the reception
    groups: text("groups", {mode: "json"}).$type<string[]>().default(sql`(json_array())`),
    // Response Details
    indianResponse: integer("indian_response", {mode: 'boolean'}), // Obviously true = coming and false = not coming
    nuptialsResponse: integer("nuptials_response", {mode: 'boolean'}), // Obviously true = coming and false = not coming
    receptionResponse: integer("reception_response", {mode: 'boolean'}), // Obviously true = coming and false = not coming
    plus1: integer("plus1_response", {mode: 'boolean'}), // true = yes, bringing plus 1 and false = no plus 1
    plus1Name: text("plus1_name"), // valid only if plus 1 is filled in
    dietaryRequirements: text("dietary_requirements"),
    extraSong: text("extra_song")
});

export const plus1LinkRelation = relations(invitees, ({one}) => ({
    plus1Invitee: one(invitees, {
        fields: [invitees.plus1Link],
        references: [invitees.id]
    })
}));

export type Invitee = typeof invitees.$inferSelect; // return type when queried
export type NewInvitee = typeof invitees.$inferInsert; // insert type
export type RSVPResponse = Omit<Invitee, "id" | "name" | "viewCount" | "plus1Enabled" | "indianResponseEnabled" | "nuptialsResponseEnabled" | "receptionResponseEnabled" | "plus1Link" | "groups">
