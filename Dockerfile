FROM formio/formio-enterprise:7.3.2

USER root
RUN setcap -r $(which node)
USER formiouser
