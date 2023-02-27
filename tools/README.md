# Innhold

* Skript for å kopiere innholdet i en skjemadefinisjon fra en database til en annen

# Bruk

Opprett en `.env`-fil som inneholder nødvendig informasjon for tilkobling til databasene.

    FROM_MONGO_CONNECTION_URL=mongodb+srv://<username>:<password>@<cluster-ref>.mongodb.net/<dbname>?retryWrites=true&w=majority
    FROM_MONGO_DB_NAME=<dbname>
    
    TO_MONGO_CONNECTION_URL=mongodb+srv://<username>:<password>@<cluster-ref>.mongodb.net/<dbname>?retryWrites=true&w=majority
    TO_MONGO_DB_NAME=<dbname>

Kall node-skriptet med skjema-path (f.eks. nav123456) som første argument.

    > node index.js <skjema-path>

# Hva kopieres?

* title
* components
* properties
* modified

# Mulig utvidelser?

* Mulighet til å kopiere et skjema som ikke eksisterer i target-db. Må da sørge for at projectId, access-array og lignende blir riktig.
  * Workaround: Opprett en tom søknad med samme skjemanummer/path i target-db før skriptet kjøres.
