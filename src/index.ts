import { readFile } from "fs/promises";
import express from "express"
import Handlebars from "handlebars";
import tokenService from "./utils/tokens.js";
import { RSVPResponse, getInvitee, getInvitees, incrementViewCount, insertInvitee, invitationResponse, isValidInviteeCode, updateInvitee } from "./db/db.js";
import { handlebarsInit } from "./utils/handlebars.js";

const port = process.env["PORT"] || 3000;
const isDev = process.env["NODE_ENV"] !== "production";

interface InviteeResponse {
    token: string,
    indianResponse?: 'yes' | 'no',
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
        const invitees = await getInvitees();
        const inviteeNames = invitees.map(it => it.name);
        
        const seedPath = process.env["SEED"] ?? "./db/seed.json";
        const seedStr = await readFile(seedPath, "utf8");
        const seed = JSON.parse(seedStr);

        const filtered = seed.filter((it: any) => {
            if (inviteeNames.includes(it.name)) {
                console.warn("Name already exists, ignoring: ", it.name);
                return false;
            }
            else {
                return true;
            }
        });
        
        if (filtered.length > 0) {
            const inserts = await insertInvitee(filtered);
            console.log("inserted:", inserts);
        }
        else {
            console.log("Nothing to insert");
        }        
        process.exit();
    }

    console.log("Loading Handlebars");
    await handlebarsInit();

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    app.use("/res", express.static("static/client"));
    app.use("/info", express.static("static/content"));

    // Templates
    let clientTemplateStr = await readFile("./static/client.html", "utf8");
    let clientTemplate = Handlebars.compile(clientTemplateStr);

    let adminTemplateStr = await readFile("./static/admin.html", "utf8");
    let adminTemplate = Handlebars.compile(adminTemplateStr);

    app.get("/", (req, res) => {
        res.sendFile("static/client-landing.html", {root: "."});
    });

    app.get("/info", (req, res) => {
        res.sendFile("static/content/index.html", {root: "."});
    });

    app.get("/admin", async (req, res) => {

        // Check auth
        const adminUsername = process.env["ADMIN_USERNAME"];
        const adminToken = process.env["ADMIN_TOKEN"];
        if (!adminUsername || !adminToken) {
            console.error("ADMIN_TOKEN is not defined! Admin page is inaccessable");
            return res.status(404).end();
        }
        
        // Check if the token is attached
        const header = req.headers.authorization;
        if (!header) {
            res.setHeader("WWW-Authenticate", "Basic realm=admin");
            return res.status(401).send();
        }

        const token = atob(header.replace("Basic ", ""));
        const [username, password] = token.split(":");

        if (!username || !password) {
            return res.status(401).send();
        }

        if (username !== adminUsername || password !== adminToken) {
            return res.status(401).send();
        }


        if (isDev) {
            adminTemplateStr = await readFile("./static/admin.html", "utf8");
            adminTemplate = Handlebars.compile(adminTemplateStr);
        }

        const invitees = await getInvitees();
        res.send(adminTemplate({token: password, invitees}));
    });

    app.post("/admin-invitee-add", async (req, res) => {
        // console.log(req.body);
        const inviteeRes: InviteeResponse = req.body;
        const token = inviteeRes.token;

        const adminUsername = process.env["ADMIN_USERNAME"];
        const adminToken = process.env["ADMIN_TOKEN"];
        if (!adminUsername || !adminToken) {
            console.error("ADMIN_TOKEN is not defined! Admin page is inaccessable");
            return res.status(404).end();
        }

        if (token !== adminToken) {
            return res.status(401).send();
        }

        const newInvitee = req.body;
        if (!newInvitee.name) {
            return res.status(400).send("Name is missing!");
        }

        const inviteeObj = {
            name: newInvitee.name,
            plus1Enabled: newInvitee.plus1Enabled === "on",
            indianResponseEnabled: newInvitee.indianResponseEnabled === "on",
            nuptialsResponseEnabled: newInvitee.nuptialsResponseEnabled === "on",
            receptionResponseEnabled: newInvitee.receptionResponseEnabled === "on"
        };
        console.log(inviteeObj);

        const invitee = await insertInvitee([inviteeObj]);

        console.log(invitee);

        res.redirect("/admin");
    });

    app.post("/invitee-response", async (req, res) => {
        // Save the changes
        console.log(req.body);

        const inviteeRes: InviteeResponse = req.body;

        const id = inviteeRes.token;

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
            indianResponse: YesNoToBool(inviteeRes.indianResponse),
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
                console.log(invitee);
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

