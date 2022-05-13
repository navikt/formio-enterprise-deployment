# formio-enterprise-deployment
Deployment of the formio enterprise server to gcp.

## Docker image
The official formio/formio-enterprise image requires the NET_BIND_SERVICE capability to be available,
but NAIS does not allow this, so we have a custom Dockerfile in this repository which is used to
build our own docker image (see workflow `docker-build.yaml`).
