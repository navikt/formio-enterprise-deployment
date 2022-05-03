# formio-enterprise-deployment
Deployment of the formio enterprise server to gcp

## Docker image
There exists a list of [allowed registries](https://docs.nais.io/deployment/allowed-registries/) for NAIS, so we need to retag formio/formio-enterprise, e.g.:

    docker pull formio/formio-enterprise:7.3.2
    docker tag formio/formio-enterprise:7.3.2 ghcr.io/navikt/formio-enterprise-deployment/formio-enterprise:7.3.2
    docker push ghcr.io/navikt/formio-enterprise-deployment/formio-enterprise:7.3.2
