import { readFile } from "fs/promises";
import Handlebars from "handlebars";

Handlebars.registerHelper("nullCheck", (value) => {
    return value ? value : "None"; 
});

Handlebars.registerHelper('json', function(this: any) {
    return JSON.stringify(this);
});

Handlebars.registerHelper('isSet', function(value) {
    return value !== null || value !== undefined;
});

Handlebars.registerHelper('not', function(this: any, value: any) {
    // console.log(this, value);
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

async function registerFilePartial(name: string, partialPath: string): Promise<void> {
    const partial = await readFile(partialPath, "utf8");
    Handlebars.registerPartial(name, partial);
}

export function handlebarsInit(): Promise<void[]> {
    return Promise.all([
        registerFilePartial("boolToYN", "static/partials/boolToYN.hbs"),
    ])
}
