ARG version
FROM formio/formio-enterprise:${version}

USER root
RUN setcap -r $(which node)
USER formiouser
