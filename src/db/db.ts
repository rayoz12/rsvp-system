import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { and, eq } from 'drizzle-orm';

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
    // Base Details
    id: text('id').primaryKey().$defaultFn(randomID),
    name: text('name').notNull(),
    viewCount: integer("view_count").notNull().default(0),
    // Response Details
    nuptialsResponse: integer("nuptials_response", {mode: 'boolean'}), // Obviously true = coming and false = not coming
    receptionResponse: integer("reception_response", {mode: 'boolean'}), // Obviously true = coming and false = not coming
    plus1Enabled: integer("plus1_enabled", {mode: 'boolean'}).notNull(), // If this user has the option to bring a plus1
    plus1: integer("plus1_response", {mode: 'boolean'}), // true = yes, bringing plus 1 and false = no plus 1
    plus1Name: text("plus1_name"), // valid only if plus 1 is filled in
    dietaryRequirements: text("dietary_requirements"),
    extraSong: text("extra_song")
});

export type Invitee = typeof invitees.$inferSelect; // return type when queried
export type NewInvitee = typeof invitees.$inferInsert; // insert type

const databasePath = process.env["DATABASE"] || "rsvp.sqlite.db"

const sqlite = new Database(databasePath);
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: './drizzle' });


export const getInvitees = () => {
    return db.select().from(invitees);
}

export const getInvitee = async (inviteeId: string) => {
    const result = await db.select().from(invitees).where(eq(invitees.id, inviteeId)).limit(1);
    if (result.length === 0) {
        return null;
    }
    else {
        return result[0];
    }
}

export const insertInvitee = (values: NewInvitee | NewInvitee[]) => {
    return db.insert(invitees).values(values as any).returning({ id: invitees.id });
}

export const updateInvitee = (value: Invitee) => {
    
    return db.update(invitees).set(value)
    .where(
        and(
            eq(invitees.id, value.id),
            eq(invitees.name, value.name),
            eq(invitees.plus1Enabled, value.plus1Enabled)
        )
    );
}

export const incrementViewCount = async (invitee: Invitee) => {
    if (!invitee) {
        throw new Error("Invitee not Found!");
    }
    invitee.viewCount++;
    return updateInvitee(invitee);
}

export const incrementViewCountById = async (inviteeId: string) => {
    const invitee = await getInvitee(inviteeId);
    if (!invitee) {
        throw new Error("Invitee not Found!");
    }
    invitee.viewCount++
    updateInvitee(invitee);
}

export const isValidInviteeCode = async (inviteeId: string) => {
    const row: {result: 1 | 0} = sqlite.prepare('SELECT EXISTS(SELECT 1 FROM invitees WHERE id=?) as result').get(inviteeId) as any;
    return row.result === 1;
}
