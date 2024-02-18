import { readFile } from "fs/promises";
import express from "express"
import Handlebars from "handlebars";
import tokenService from "./utils/tokens.js";
import { RSVPResponse, getInvitee, getInvitees, incrementViewCount, insertInvitee, invitationResponse, isValidInviteeCode, updateInvitee } from "./db/db.js";

const port = process.env["PORT"] || 3000;
const isDev = process.env["NODE_ENV"] !== "production";

Handlebars.registerHelper("nullCheck", (value) => {
    return value ? value : "None"; 
});

Handlebars.registerHelper('json', function(this: any) {
    return JSON.stringify(this);
});

Handlebars.registerHelper('isSet', function(value) {
    return value !== null || value !== undefined;
});

Handlebars.registerHelper('not', function(value) {
    return !value;
});

Handlebars.registerHelper('cleanDietRequirements', function(value: string) {
    if (!value) {
        return ""
    }
    const newValue = value.replace("Vegetarian\n", "").replace("Vegan\n", "").trim();
    console.log(newValue);
    if (newValue === "") 
        return null;
    else
        return newValue;
});

Handlebars.registerHelper('contains', function(value: string, substring: string) {
    if (value === null) {
        return false;
    }
    return value.includes(substring);
});

interface InviteeResponse {
    token: string,
    nuptialsResponse?: 'yes' | 'no',
    receptionResponse?: 'yes' | 'no',
    plus1?: 'yes' | 'no',
    plus1Name?: string,
    dietaryRequirementsVegetarian?: 'on',
    dietaryRequirementsVegan?: 'on',
    dietaryRequirements?: string,
    extraSong?: string
}

const YesNoToBool = (text?: string) => {
    if (text === "yes") {
        return true;
    }
    else if (text === "no") {
        return false;
    }
    else {
        return null;
    }
}

function stringToBool(text?: string) {
    if (text === "true") {
        return true;
    }
    else if (text === "false") {
        return false;
    }
    else {
        return null;
    }
}

async function main() {
    
    
    if (process.argv.includes("--seed")) {
        // Seed database
        console.log("Seeding database...");
        await getInvitees();
        const seedStr = await readFile("./db/seed.json", "utf8");
        const seed = JSON.parse(seedStr);
        const inserts = await insertInvitee(seed);
        console.log("inserted:", inserts);
        
        process.exit();
    }

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    app.use("/res", express.static("static/client"));

    // Templates
    let clientTemplateStr = await readFile("./static/client.html", "utf8");
    let clientTemplate = Handlebars.compile(clientTemplateStr);

    let adminTemplateStr = await readFile("./static/admin.html", "utf8");
    let adminTemplate = Handlebars.compile(clientTemplateStr);

    app.get("/", (req, res) => {
        res.sendFile("static/client-landing.html", {root: "."});
    });

    app.get("/admin", async (req, res) => {
        if (isDev) {
            adminTemplateStr = await readFile("./static/admin.html", "utf8");
            adminTemplate = Handlebars.compile(adminTemplateStr);
        }

        const invitees = await getInvitees();
        res.send(adminTemplate({invitees}));
    });

    app.post("/invitee-response", async (req, res) => {
        // Save the changes
        console.log(req.body);

        const inviteeRes: InviteeResponse = req.body;

        // const token = tokenService.getToken(body.token);
        const id = inviteeRes.token;
        // const invitee = await getInvitee(id);
        // if (!invitee) {
        //     res.status(404).sendFile("static/client-not-found.html", {root: "."});
        //     return;
        // }

        let dietaryRequirements = "";
        if (inviteeRes.dietaryRequirementsVegetarian) {
            dietaryRequirements += "Vegetarian\n";
        }
        if (inviteeRes.dietaryRequirementsVegan) {
            dietaryRequirements += "Vegan\n";
        }
        if (inviteeRes.dietaryRequirements) {
            dietaryRequirements += inviteeRes.dietaryRequirements + "\n";
        }

        const rsvpResponse: RSVPResponse = {
            nuptialsResponse: YesNoToBool(inviteeRes.nuptialsResponse),
            receptionResponse: YesNoToBool(inviteeRes.receptionResponse),
            plus1: YesNoToBool(inviteeRes.plus1),
            plus1Name: inviteeRes.plus1Name ?? null,
            dietaryRequirements: dietaryRequirements === "" ? null : dietaryRequirements,
            extraSong: inviteeRes.extraSong ?? null,
        }
        
        try {
            await invitationResponse(id, rsvpResponse);
            res.redirect(`/${id}?saved=true`);
        }
        catch (e) {
            const error = e as Error;
            if (error.message === "Invitee not Found") {
                res.status(404).sendFile("static/client-not-found.html", {root: "."});
                return;
            }
            else {
                res.redirect(`/${id}?saved=false`);
            }
        }
    });

    app.get("/:id", async (req, res) => {
        const {id: idRaw} = req.params;
        const id = idRaw.toLowerCase();
        if (!id) {
            throw new Error("id not passed");
        }
        console.log(id);

        let isSavedStr: string | undefined = req.query.saved as string | undefined;
        let isSaved = null;
        if (isSavedStr) {
            isSaved = stringToBool(isSavedStr);
        }

        if (isDev) {
            clientTemplateStr = await readFile("./static/client.html", "utf8");
            clientTemplate = Handlebars.compile(clientTemplateStr);
        }

        const invitee = await getInvitee(id);
        if (invitee) {
            incrementViewCount(invitee).then(result => console.log(`${invitee.name} has viewed ${invitee.viewCount} time(s)`))
            // res.send(clientTemplate({...invitee, token: tokenService.getToken(id)}));
            if (isSaved === null) {
                res.send(clientTemplate({...invitee, token: id}));
            }
            else if (isSaved) {
                res.send(clientTemplate({...invitee, token: id, notification: "Saved"}));
            }
            else if (!isSaved) {
                res.send(clientTemplate({...invitee, token: id, error: "Failed to save"}));
            }
        }
        else {
            res.status(404).sendFile("static/client-not-found.html", {root: "."});
        }
    });
    
    app.listen(port, () => {
        console.log(`RSVP System listening on ${port}`)
    })
}

main();

