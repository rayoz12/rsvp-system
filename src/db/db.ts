import Database from 'better-sqlite3';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { invitees, plus1LinkRelation, NewInvitee, Invitee, RSVPResponse } from './schema.js';

const databasePath = process.env["DATABASE"] || "rsvp.sqlite.db"

const sqlite = new Database(databasePath);
const db = drizzle(sqlite, {schema: {invitees, plus1LinkRelation}});
migrate(db, { migrationsFolder: './drizzle' });


export const getInvitees = () => {
    return db.query.invitees.findMany({with: { plus1Invitee: true }});
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
export type InviteePlus1 = NonNullable<Awaited<ReturnType<typeof getInvitee>>>

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
    // @ts-expect-error
    delete response.plus1Invitee;

    const invitee = await getInvitee(inviteeId);
    if (!invitee) {
        throw new Error("Invitee not Found");
    }

    const updated = {...invitee, ...response};

    // @ts-expect-error
    delete updated.plus1Invitee;

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
