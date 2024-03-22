const {MongoClient} = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const env = (name, defaultValue = "placeholder") => {
    const value = process.env[name];
    if (!value) {
        if (defaultValue !== "placeholder") {
            return defaultValue;
        }
        console.error(`Missing env ${name}`);
        process.exit(1);
    }
    return value;
}

const SOURCE_DB = {
    url: env("FROM_MONGO_CONNECTION_URL"),
    dbName: env("FROM_MONGO_DB_NAME"),
}

const TARGET_DB = {
    url: env("TO_MONGO_CONNECTION_URL"),
    dbName: env("TO_MONGO_DB_NAME"),
}

let FORM_PATHS = env("FORM_PATHS", "").split(",").map(p => p.trim()).filter(p => !!p);

const clientSourceDb = new MongoClient(SOURCE_DB.url);
const clientTargetDb = new MongoClient(TARGET_DB.url);

async function main() {
    const args = process.argv.slice(2);
    const formPath = args[0];
    if (formPath) {
        FORM_PATHS = [formPath];
    } else if (!FORM_PATHS.length) {
        console.error("Unable to resolve which forms to copy. Provide form path as argument, or set env FORM_PATHS as comma separated list of paths.");
        process.exit(1);
    }
    console.log("Following forms will be copied:", FORM_PATHS.join(","));
    console.log("");

    await clientSourceDb.connect();

    console.log("Connected to source db");
    await clientTargetDb.connect();
    console.log("Connected to target db");
    const sourceDb = clientSourceDb.db(SOURCE_DB.dbName);

    const targetDb = clientTargetDb.db(TARGET_DB.dbName);
    const sourceColForms = sourceDb.collection("forms");
    const missingInTargetDB = [];
    const updatedForms = [];
    const formsWithNoChange = [];

    for (let i = 0; i < FORM_PATHS.length; i++) {
        const path = FORM_PATHS[i];
        const FORM_QUERY_FILTER = {path};
        console.log("");
        console.log(`:: ${path} ::`);
        console.log(`Lookup form ${path} in source db...`);
        const sourceForm = await sourceColForms.findOne(FORM_QUERY_FILTER);
        if (!sourceForm) {
            console.warn(`Form ${path} not found in source db`);
            continue;
        }
        console.log(`Found form ${path} in source db (modified ${sourceForm.modified})`);

        console.log(`Lookup form ${path} in target db...`);
        const targetColForms = targetDb.collection("forms");
        const targetForm = await targetColForms.findOne(FORM_QUERY_FILTER);
        if (targetForm) {
            console.log(`Found form ${path} in target db (modified ${targetForm.modified})`);
            const formUpdateResult = await targetColForms.updateOne(FORM_QUERY_FILTER, {
                $set: {
                    title: sourceForm.title,
                    components: sourceForm.components,
                    properties: sourceForm.properties,
                    modified: sourceForm.modified,
                }
            });
            const { modifiedCount} = formUpdateResult;
            console.log(`Form ${modifiedCount ? 'was' : 'not'} modified in target db`);
            if (modifiedCount) {
                updatedForms.push(path);
            } else {
                formsWithNoChange.push(path);
            }
        } else {
            console.warn(`Form ${path} not found in target db`);
            missingInTargetDB.push(`${sourceForm.properties.skjemanummer} (${path})`);
        }
    }
    console.log("");
    console.log(":: Summary ::");
    console.log(`Number of updated forms: ${updatedForms.length}`);
    if (formsWithNoChange.length) {
        console.log(`Following forms had no updates: ${formsWithNoChange.join(",")}`);
    }
    if (missingInTargetDB.length) {
        console.log(`Following forms where missing in target DB: \n * ${missingInTargetDB.join("\n * ")}`)
    }
    console.log("");
    return "The end";
}

main()
    .then(console.log)
    .catch(console.error)
    .finally(async () => {
        await clientSourceDb.close()
        await clientTargetDb.close()
    });
