# formio-enterprise-deployment
Deployment of the formio enterprise server to gcp.

## Docker image
The official formio/formio-enterprise image requires the NET_BIND_SERVICE capability to be available,
but [NAIS](https://doc.nais.io/) does not allow this, so we have a custom Dockerfile in this repository which is used to
build our own docker image (see workflow `docker-build.yaml`).

# NAIS configuration files

## .nais/nais.yaml
Common [NAIS](https://doc.nais.io/) configuration for our [Formio](https://www.form.io/) api servers running in gcp.

### .nais/dev.yaml
This is the configuration for our _production_ deployment.

It is currently running in `dev-gcp`, but we aspire to move this server to `prod-gcp`,
and should then rename this file to _prod.yaml_.

### .nais/dev0.yaml
Contains configuration for the api server which is intended for development purposes.
It will be connected to a copy of the database, and thus will not interfere with production data.
