import { readFile } from "fs/promises";
import express from "express"
import Handlebars from "handlebars";
import { getInvitee, getInvitees, incrementViewCount, insertInvitee, isValidInviteeCode } from "./db/db.js";

const port = process.env["PORT"] || 3000;

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

    const clientTemplateStr = await readFile("./static/client.html", "utf8");
    const clientTemplate = Handlebars.compile(clientTemplateStr);

    app.get("/", (req, res) => {
        res.sendFile("static/client-landing.html", {root: "."});
    });

    app.get("/:id", async (req, res) => {
        const {id: idRaw} = req.params;
        const id = idRaw.toLowerCase();
        if (!id) {
            throw new Error("id not passed");
        }
        console.log(id);

        const invitee = await getInvitee(id);
        if (invitee) {
            incrementViewCount(invitee).then(result => console.log(`${invitee.name} has viewed ${invitee.viewCount} time(s)`))
            res.send(clientTemplate(invitee));
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

