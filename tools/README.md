# Innhold

* Skript for å kopiere innholdet i en skjemadefinisjon fra en database til en annen

# Bruk

Opprett en `.env`-fil som inneholder nødvendig informasjon for tilkobling til databasene.

    FROM_MONGO_CONNECTION_URL=mongodb+srv://<username>:<password>@<cluster-ref>.mongodb.net/<dbname>?retryWrites=true&w=majority
    FROM_MONGO_DB_NAME=<dbname>
    
    TO_MONGO_CONNECTION_URL=mongodb+srv://<username>:<password>@<cluster-ref>.mongodb.net/<dbname>?retryWrites=true&w=majority
    TO_MONGO_DB_NAME=<dbname>

    # optional
    FORM_PATHS=nav123456,nav123457b,nav123458

Kall node-skriptet med skjema-path (f.eks. nav123456) som første argument, eller oppgi flere skjema-paths
i miljøvariabel `FORM_PATHS` som vist i eksempelet ovenfor.

    > node index.js <skjema-path>

# Hva kopieres?

* title
* components
* properties
* modified

# Output

Eksempel på output fra skriptet:

    Following forms will be copied: nav100706,nav230505,nav111218b,nav111222b
    
    Connected to source db
    Connected to target db
    
    :: nav100706 ::
    Lookup form nav100706 in source db...
    Found form nav100706 in source db (modified Mon Feb 12 2024 15:16:30 GMT+0100 (Central European Standard Time))
    Lookup form nav100706 in target db...
    Found form nav100706 in target db (modified Mon Feb 12 2024 15:16:30 GMT+0100 (Central European Standard Time))
    Form not modified in target db
    
    :: nav230505 ::
    Lookup form nav230505 in source db...
    Found form nav230505 in source db (modified Fri Sep 29 2023 11:10:46 GMT+0200 (Central European Summer Time))
    Lookup form nav230505 in target db...
    Found form nav230505 in target db (modified Fri Sep 29 2023 11:10:46 GMT+0200 (Central European Summer Time))
    Form not modified in target db
    
    :: nav111218b ::
    Lookup form nav111218b in source db...
    Found form nav111218b in source db (modified Thu Mar 21 2024 10:17:59 GMT+0100 (Central European Standard Time))
    Lookup form nav111218b in target db...
    Form nav111218b not found in target db
    
    :: nav111222b ::
    Lookup form nav111222b in source db...
    Found form nav111222b in source db (modified Thu Mar 21 2024 10:17:34 GMT+0100 (Central European Standard Time))
    Lookup form nav111222b in target db...
    Found form nav111222b in target db (modified Fri Mar 22 2024 14:19:52 GMT+0100 (Central European Standard Time))
    Form was modified in target db
    
    :: Summary ::
    Number of updated forms: 1
    Following forms had no updates: nav100706,nav230505
    Following forms where missing in target DB:
    * NAV 11-12.18B (nav111218b)
    
    The end

Under 'Summary' ser man hvor mange skjemaer som ble kopiert, eventuelt hvilke skjema som ikke hadde noen endringer,
samt en liste over skjemanummer som ikke eksisterer i databasen dit den skulle kopieres. Disse skjemanumrene kan man
gå inn i byggeren og opprette tomme dummy-skjema med, og deretter kjøre skriptet på nytt.

# Mulig utvidelser?

* Mulighet til å kopiere et skjema som ikke eksisterer i target-db. Må da sørge for at projectId, access-array og lignende blir riktig.
  * Workaround: Opprett en tom søknad med samme skjemanummer/path i target-db før skriptet kjøres.
