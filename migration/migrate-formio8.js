const { MongoClient } = require("mongodb");
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

const url = env("MONGO_CONNECTION_URL");
const dbName = env("MONGO_DB_NAME");
const projectName = env("FORMIO_NAVFORMS_PROJECT_NAME");

const client = new MongoClient(url);

async function main() {
  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(dbName);

  const projectsCollection = db.collection("projects");
  const project = await projectsCollection.findOne({"name": projectName});
  if (!project) {
    console.log(`Could not find project with name '${projectName}'`);
    process.exit(1);
  }

  const projectId = project._id;
  console.log(`Found project ${projectName} (id=${projectId})`);

  const rolesCollection = db.collection("roles");
  const projectRoles = await rolesCollection.find({project: projectId}).toArray();
  const everyoneRoleId = "000000000000000000000000";
  console.log(`Found ${projectRoles.length} roles for project`);
  projectRoles.forEach(role => {
    console.log(`- ${role.title} (id=${role._id})`);
  });
  const administratorRole = projectRoles.find(role => role.title === "Administrator");
  const authenticatedRole = projectRoles.find(role => role.title === "Authenticated");
  const anonymousRole = projectRoles.find(role => role.title === "Anonymous");
  if (!administratorRole || !authenticatedRole || !anonymousRole) {
    console.log("Failed to identify roles");
    process.exit(1);
  }

  const formsCollection = db.collection('forms');

  const resource = {
    submissionAccess: [
      {"type": "create_all", roles: []},
      {"type": "read_all", roles: [everyoneRoleId]},
      {"type": "update_all", roles: [authenticatedRole._id]},
      {"type": "delete_all", roles: [authenticatedRole._id]},
      {"type": "create_own", roles: [authenticatedRole._id]},
      {"type": "read_own", roles: [authenticatedRole._id]},
      {"type": "update_own", roles: [authenticatedRole._id]},
      {"type": "delete_own", roles: [authenticatedRole._id]},
    ],
    access: [{
      "type": "read_all",
      "roles": [everyoneRoleId],
    }],
  };

  /**
   * MOTTAKSADRESSE RESOURCE
   */
  const formMottaksadresseQuery = {"path": "mottaksadresse"};
  const mottaksadresseResult = await formsCollection.updateOne(formMottaksadresseQuery, { $set: { access: resource.access, submissionAccess: resource.submissionAccess } });
  // oppdater mottaksadresse form
  console.log("mottaksadresse form", mottaksadresseResult);

  /**
   * LANGUAGE RESOURCE
   */
  const formLanguageQuery = {"path": "language"};
  const languageResult = await formsCollection.updateOne(formLanguageQuery, { $set: { access: resource.access, submissionAccess: resource.submissionAccess } });
  console.log("language form", languageResult);

  /**
   * FORMS (tag 'nav-skjema')
   */
  const formsQuery = {"tags": "nav-skjema"};
  const forms = await formsCollection.find(formsQuery).toArray();
  console.log(`Updating ${forms.length} forms...`);
  const formUpdateResult = await formsCollection.updateMany(formsQuery, { $set: {
    access: [
      {"type": "read_all", "roles": [everyoneRoleId]},
      {"type": "update_all", "roles": [administratorRole._id, authenticatedRole._id]}
    ]
  }});
  console.log("formUpdateResult", formUpdateResult);

  console.log("Migration done");

  console.log("");
  console.log("");
  console.log("For Secret Manager (bygger-dev):");
  console.log("");
  console.log(`FORMIO_PROJECT_ID=${project._id}`);
  console.log(`FORMIO_ROLE_ID_ADMINISTRATOR=${administratorRole._id}`);
  console.log(`FORMIO_ROLE_ID_AUTHENTICATED=${authenticatedRole._id}`);
  console.log("");

  return "The end";
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());
