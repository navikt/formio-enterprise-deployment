const {MongoClient} = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const env = name => {
    const value = process.env[name];
    if (!value) {
        console.log(`Missing env ${name}`);
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

const clientSourceDb = new MongoClient(SOURCE_DB.url);
const clientTargetDb = new MongoClient(TARGET_DB.url);

async function main() {
    const args = process.argv.slice(2);
    const formPath = args[0];
    if (!formPath) {
        console.log("Missing argument: form path");
        process.exit(1);
    }
    const FORM_QUERY_FILTER = {path: formPath};

    await clientSourceDb.connect();
    console.log("Connected to source db");
    await clientTargetDb.connect();
    console.log("Connected to target db");

    const sourceDb = clientSourceDb.db(SOURCE_DB.dbName);
    const targetDb = clientTargetDb.db(TARGET_DB.dbName);
    console.log(`Lookup form ${formPath} in source db...`);
    const sourceColForms = sourceDb.collection("forms");
    const sourceForm = await sourceColForms.findOne(FORM_QUERY_FILTER);
    if (sourceForm) {
        console.log(`Found form ${formPath} in source db (modified ${sourceForm.modified})`);
    } else {
        console.log(`Form ${formPath} not found in source db`);
        process.exit(1);
    }

    console.log(`Lookup form ${formPath} in target db...`);
    const targetColForms = targetDb.collection("forms");
    const targetForm = await targetColForms.findOne(FORM_QUERY_FILTER);
    if (targetForm) {
        console.log(`Found form ${formPath} in target db (modified ${targetForm.modified})`);
        const formUpdateResult = await targetColForms.updateOne(FORM_QUERY_FILTER, {
            $set: {
                title: sourceForm.title,
                components: sourceForm.components,
                properties: sourceForm.properties,
                modified: sourceForm.modified,
            }
        });
        console.log("formUpdateResult", formUpdateResult);
    } else {
        console.log(`Form ${formPath} not found in target db`);
    }

    return "The end";
}

main()
    .then(console.log)
    .catch(console.error)
    .finally(async () => {
        await clientSourceDb.close()
        await clientTargetDb.close()
    });
