import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { and, eq, relations } from 'drizzle-orm';

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
export type InviteePlus1 = NonNullable<Awaited<ReturnType<typeof getInvitee>>>
export type NewInvitee = typeof invitees.$inferInsert; // insert type
export type RSVPResponse = Omit<Invitee, "id" | "name" | "viewCount" | "plus1Enabled" | "indianResponseEnabled" | "nuptialsResponseEnabled" | "receptionResponseEnabled" | "plus1Link">

const databasePath = process.env["DATABASE"] || "rsvp.sqlite.db"

const sqlite = new Database(databasePath);
const db = drizzle(sqlite, {schema: {invitees, plus1LinkRelation}});
migrate(db, { migrationsFolder: './drizzle' });


export const getInvitees = () => {
    return db.select().from(invitees);
}

export async function getInvitee(inviteeId: string) {
    const result = await db.query.invitees.findFirst({
        with: { plus1Invitee: true },
        where: (invitees, { eq }) => eq(invitees.id, inviteeId)
    });
    if (result === undefined) {
        return null;
    }
    else {
        return result;
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
            eq(invitees.name, value.name)
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

export const invitationResponse = async (
    inviteeId: string, response: RSVPResponse
) => {
    // @ts-expect-error
    delete response.id;
    // @ts-expect-error
    delete response.name;
    // @ts-expect-error
    delete response.viewCount;
    // @ts-expect-error
    delete response.plus1Enabled;

    const invitee = await getInvitee(inviteeId);
    if (!invitee) {
        throw new Error("Invitee not Found");
    }

    const updated = {...invitee, ...response};

    console.log("Updating Invitee:", updated);
    // return;

    return db.update(invitees).set(updated)
    .where(
        and(
            eq(invitees.id, updated.id),
            eq(invitees.name, updated.name),
            eq(invitees.plus1Enabled, updated.plus1Enabled)
        )
    );  
}
