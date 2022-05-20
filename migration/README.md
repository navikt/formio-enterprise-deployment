# Migrering fra open source til formio enterpriser api server

# Migrering steg-for-steg

## 1. Slett applikasjon `formio-api-server` (open source-serveren) i dev-gcp

    kubectl delete app formio-api-server

Fra nå vil byggeren naturlig nok være utilgjengelig, og det vil ikke være mulig å gjøre endringer
på skjemadefinisjonene.

## 2. Ta backup av mongo-databasen

Dette gjøres i tilfelle migreringen feiler, og vi må rulle tilbake til open source-serveren, for når
enterprise-serveren kobler til prod-databasen vil det automatisk kjøres noen migreringsskript som gjør at 
open source-serveren ikke greier å koble til databasen lenger.

Vi benytter denne anledningen til å endre navn på databasen som i dag heter `heroku_8grt8sjm` til `navforms_prod`.

Først ta backup:

    mongodump 'mongodb+srv://<admin>:<pwd>@cluster0.XXXXX.mongodb.net' --readPreference=secondary --archive="backup_heroku_8grt8sjm" --db=heroku_8grt8sjm

Bruk backup, og opprett en ny database med navn `navforms_prod`:

    mongorestore 'mongodb+srv://<admin>:<pwd>@cluster0.XXXXX.mongodb.net' --archive="backup_heroku_8grt8sjm" --nsFrom="heroku_8grt8sjm.*" --nsTo="navforms_prod.*"

Finn riktig connect-url i https://console.cloud.google.com: Secret Manager -> secret `formio-api-server`.

## 3. Sjekk at app `formio-enterprise-server` ikke kjører dev-gcp

    kubectl get app

Slett app hvis den eksisterer:

    kubectl delete app formio-enterprise-server

## 4. Disable alle prosjekter som er knyttet til lisensen vår

Logg inn som Christian på https://portal.form.io/#/license

## 5. Deploy formio enterprise server til dev-gcp

### 5.1 Endre ingress for enterprise server
Merge PR som setter ingress til den samme vi bruker i dag for open source-serveren:
https://github.com/navikt/formio-enterprise-deployment/pull/1

### 5.2 Oppdater miljøvariabler i Secret Manager

Gå til https://console.cloud.google.com, Navigation menu -> Security -> Secret manager.

Sjekk i menyen i toppen at prosjekt `skjemadigitalisering-dev` er valgt.

Klikk på secret `formio-enterprise-server`, og oppdater følgende til riktige verdier:

    MONGO=mongodb+srv://cluster0.XXXXX.mongodb.net/navforms_prod?retryWrites=true&w=majority
    MONGO_CONFIG={"auth": {"username":"mongo-admin-brukernavn", "password": "mongo-admin-passord"}}
    JWT_SECRET=settes-til-en-lang-vilkarlig-verdi-som-ogsa-ma-legges-inn-i-secret-bygger-dev-som-FORMIO_JWT_SECRET

### 5.3 Deploy enterprise sever

Kjør [deploy.yaml](https://github.com/navikt/formio-enterprise-deployment/actions/workflows/deploy.yaml) manuelt.

## 6. Opprett hovedprosjekt for nav-skjemaene

Gå til https://formio-api-server.ekstern.dev.nav.no hvor enterprise-serveren nå kjører, og logg inn med default admin-bruker
(email og passord ligger i secret `formio-enterprise-server`).

Opprett nytt prosjekt:

    Project title: NAV Skjemabase
    Description: Inneholder NAVs skjemadefinisjoner
    Target framework: React (tror ikke dette er viktig, men...)

Refresh siden og velg det nye prosjektet. Trykk på fanen "Live" (stage), gå til "Settings" i venstremenyen, fjern haken
for "Protected mode", og trykk "Save Stage". 

Noter prosjektnavn fra input-feltet "Project Path"; dette trengs i neste steg når vi skal kjøre migreringsskriptet.

*NB!* Hvis man får en feilmelding ved lagring av Stage så kan det være at man må enable det nye prosjektet på lisensen vår.
Logg inn som Christian på inn på https://portal.form.io/#/license, og bruk prosjektnavn fra "Settings" i vår
enterprise server til å finne riktig prosjekt. Disable alle andre prosjekter.

## 7. Kjør migreringsskript som knytter eksisterende nav-skjemadefinisjoner til dette nye prosjektet

Opprett en .env-fil i samme mappe som gjeldende README.md, og legg inn følgende (erstatt alt i <>):

    MONGO_CONNECTION_URL=mongodb+srv://admin:<pwd>@<mongo_host>/navforms_prod?retryWrites=true&w=majority
    MONGO_DB_NAME=navforms_prod
    FORMIO_NAVFORMS_PROJECT_NAME=<prosjektnavn-fra-settings>

Installer dependencies, og kjør migreringsskriptet:

    yarn    
    node migrate.js

## 8. Oppdater secret for byggeren

Helt til sist i skriptet printes en rekke miljøvariabler som skal legges inn i secret `bygger-dev` i
[Secret Manager](https://console.cloud.google.com).

I tillegg må også `FORMIO_JWT_SECRET` legges inn i secret `bygger-dev` med samme verdi som `JWT_SECRET` i secret
`formio-enterprise-server`.

    FORMIO_PROJECT_ID=<project-id>
    FORMIO_ROLE_ID_ADMINISTRATOR=<admin-role-id>
    FORMIO_FORM_ID_USER=<user-form-id>
    FORMIO_PROJECT_URL=https://<formio-api-server-ingress>/<project-name>
    FORMIO_JWT_SECRET=<samme-verdi-som-i-secret-formio-enterprise-server>

## 9. Merge inn endringer i byggeren

https://github.com/navikt/skjemabygging-formio/pulls

# Rollback steg-for-steg

Dersom ting ikke fungerer som forventet ruller vi tilbake til open source-serveren.

## 1. Slett `formio-enterprise-server` hvis den kjører i dev-gcp

    kubectl delete app formio-enterprise-server

## 2. Deploy `formio-api-server` til dev-gcp

Sjekk ut [navikt/formio](https://github.com/navikt/formio):

    git clone git@github.com:navikt/formio.git
    git checkout navikt/master

Gjør en hvilken som helst endring, f.eks. i 
[README-skjemabygging.md](https://github.com/navikt/formio/blob/navikt/master/README-skjemabygging.md), commit med
melding som inneholder `[deploy]`, og push. Dette trigger workflow
[deploy.yaml](https://github.com/navikt/formio/blob/navikt/master/.github/workflows/deploy.yaml), 
og open source-serveren deployes til dev-gcp.

For mer informasjon, se https://github.com/navikt/formio/blob/navikt/master/README-skjemabygging.md#deployment-til-nais.

## 3. Rull tilbake endringer i byggeren

På master i [skjemabygging-formio](https://github.com/navikt/skjemabygging-formio), og i secret `bygger-dev`.
