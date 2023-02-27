# Formio enterprise deployment
Deployment of the formio enterprise server to gcp.

## Docker image
The official formio/formio-enterprise image requires the NET_BIND_SERVICE capability to be available,
but [NAIS](https://doc.nais.io/) does not allow this, so we have a custom Dockerfile in this repository which is used to
build our own docker image (see workflow `docker-build.yaml`).

# NAIS configuration files inside `.nais` folder

## nais.yaml
Common [NAIS](https://doc.nais.io/) configuration for our [Formio](https://www.form.io/) api servers running in gcp.

### prod.yaml
This is the configuration for our _production_ deployment. The Formio portal will not be enabled.

### authoring.yaml
Contains configuration for the api server connected to the production database, but running in `dev-gcp`.
The Formio portal will be enabled.

### dev.yaml
Contains configuration for the api server which is intended for development purposes.
It will be connected to a copy of the database, and thus will not interfere with production data.

# How to run the api server on local machine

Create a .env file in this folder, and insert following environment variables:

    LICENSE_KEY=<formio-license-key>
    MONGO=mongodb+srv://<cluster-host>/<dbname>?retryWrites=true&w=majority
    MONGO_CONFIG={"auth": {"username":"<username>", "password": "<password>"}}

`LICENSE_KEY` can be obtained from [Secret Manager](https://console.cloud.google.com/security/secret-manager) ->
secret `formio-api-server`, and values for `MONGO` and `MONGO_CONFIG` are found by logging in to
[MongoDB Cloud](https://cloud.mongodb.com/).

Start the api server locally by running `docker-compose up`. It will run on the port specified in docker-compose.yaml,
and you can now configure the applications in repository
[skjemabygging-formio](https://github.com/navikt/skjemabygging-formio) to connect to this api server.

NB! The portal is disabled locally because it requires port 3000, which is the port we run our `bygger` application.

# MongoDB: Copy of production database

We have a copy of the production database in a separate cluster on [MongoDB Cloud](https://cloud.mongodb.com/),
to which the api server intended for development is connected.

To refresh this copy, delete the database in the dev cluster by logging in to [MongoDB Cloud](https://cloud.mongodb.com/),
and then use `mongodump` and `mongorestore` commands:

    mongodump 'mongodb+srv://<prod-user>:<prod-password>@<prod-host>' --readPreference=secondary --archive="backup_db" --db=<dbname>

    mongorestore 'mongodb+srv://<dev-user>:<dev-password>@<dev-host>' --archive="backup_db"
