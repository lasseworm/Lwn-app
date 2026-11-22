# Samlet app-brief – Learn. Workout. Never Quit. (LWN)

**Appnavn:** Learn. Workout. Never Quit. (forkortet LWN)
**Domæne:** lwn.dk
**Tagline:** Your Gym. Your Equipment. Your Progress.
**Sprog:** Dansk først (UI og indhold), struktureret så flere sprog kan tilføjes senere.

## 1. Vision og formål

Byg en moderne, enkel og intelligent træningsapp, der gør nybegyndere til trygge, selvstændige og vidende brugere af et fitnesscenter.

Brugeren går ind i et center, fotograferer centrets maskiner, og appen bygger et personligt styrketræningsprogram ud fra de maskiner og redskaber, der faktisk findes. Appen lærer brugeren *hvordan* man træner, ikke kun *hvad* man skal lave.

Appen må ikke være bundet til ét center eller én maskinproducent. Den skal være simpel nok til en total nybegynder og stadig nyttig for den, der bliver mere erfaren.

**Grundprincipper**
- Gør styrketræning tilgængelig for alle.
- Brug det udstyr, der rent faktisk er i brugerens center.
- Progression sker automatisk og er gratis.
- Den væsentlige nybegynderoplevelse er gratis.
- Appen skal være hurtig at bruge midt i en træning.
- Brugerens data må aldrig gå tabt.

## 2. Målgruppe

- Primær: nybegyndere, usikre brugere af maskiner, folk der vil have et struktureret program uden personlig træner, og folk der starter op efter lang pause.
- Sekundær: let øvede, brugere der træner i flere centre, og brugere der vil følge udvikling i detaljer.
- Appen skal også kunne bruges af fitnessinstruktører, der vil hjælpe nye medlemmer i gang (se afsnit 12).

## 3. Center- og udstyrsdatabase (kernefunktion)

### Centre
- Søg efter center på navn og by, vælg et eksisterende, eller opret nyt.
- Gem flere centre på profilen (hjemme, arbejde, ferie) og vælg aktivt center før træning.
- Et center gemmes med navn og by som udgangspunkt, som andre brugere kan starte fra.
- Andre brugere kan tilføje eller fjerne maskiner. Tilføjede maskiner indgår i centrets fælles standardliste.
- Det må være gratis at oprette center og bidrage med almindelig udstyrsinformation.

### Registrering af udstyr via foto
Brugeren fotograferer en maskine. AI skal:
1. Analysere billedet og identificere maskintype og funktion.
2. Foreslå kategori, primære og sekundære muskelgrupper.
3. Foreslå relevante øvelser.
4. Bede brugeren bekræfte, hvis den er usikker.
5. Tilføje maskinen til det valgte centers udstyr.

Maskiner genkendes på **træningsfunktion**, ikke kun mærke/model (fx er alle brystpres-maskiner ækvivalente). Ved usikkerhed kan brugeren selv vælge eller rette maskintypen.

### Multifunktionsudstyr
Rack, håndvægte, stang, bænke, Smith-rack, kabelmaskine osv. skal kunne tilføjes **uden** at vælge øvelsestype eller muskelgruppe. Øvelserne bestemmes af programmet ud fra hvad udstyret kan bruges til.

### Standardudstyr der kan vælges
Måtter, pull-up-stang, ribber, bosu-bolde og lignende kan vælges som ekstra standardudstyr.

### Vægtintervaller
- Maskinvægte stiger i trin (fx 3,5 kg eller 7 kg), så **vægttrin skal kunne vælges** pr. maskine.
- Brugeren kan fotografere maskinens vægtstak, og appen beregner automatisk vægtintervallerne.
- Der skal være mulighed for en ekstra mellemplade (fx maskine i 7 kg-trin plus 3,5 kg ekstra).

### Kvalitet og privatliv
- Dublet-detektion, "afventer verifikation" for nye/usikre maskiner, fællesskabsbekræftelse, tidsstempel for seneste opdatering, rapportering af forkerte oplysninger, kategorier og øvelsesmapping.
- Billeder, der ikke forestiller udstyr, må **ikke** kunne deles.
- Eksempeldata (demo-centre og -maskiner) skal tydeligt adskilles fra verificerede data.

## 4. Maskininstruktioner og øvelsesvejledning

Hver genkendt maskine får en instruktionsside med:
- Navn, kategori, trænede muskler (primære/sekundære).
- Justering af maskinen og korrekt startposition.
- Trin-for-trin udførelse, teknik, vejrtrækning.
- Almindelige fejl og sikkerhedsråd.
- Foreslåede nybegynderindstillinger.
- Tydelige illustrationer eller animationer af korrekt udførelse. Brugerens egne fotos af maskinen kan bruges til at vise øvelsen.

Indholdet skal være lettilgængeligt for én, der aldrig har brugt maskinen, og bygge på opdateret, evidensbaseret viden.

## 5. Personligt træningsprogram

Programmet genereres ud fra erfaring, mål, tilgængeligt udstyr i det valgte center, antal ugentlige pas (2, 3 eller 4, kan ændres senere), øvelsespræferencer og fysiske begrænsninger.

- Nybegynderprogrammet bruger primært maskiner. Frie vægte medtages kun, hvis muskelgrupper ikke kan dækkes af maskinerne.
- Dæk alle store muskelgrupper, balancér push/pull og over-/underkrop, brug fornuftigt nybegyndervolumen, undgå kompleksitet, sørg for restitution.
- Tving aldrig øvelser ind, som centret ikke har udstyr til.
- Hver 12. uge med nogenlunde regelmæssig træning spørger appen, om brugeren vil have et opdateret program, og om flere øvelser skal være med frie vægte.

## 6. Alternativer, udeladelser og smerte

- Brugeren kan nemt springe over eller udskifte en øvelse (maskine optaget/ude af drift, brugeren ikke bryder sig om øvelsen, kan ikke udføre den korrekt, kendt begrænsning).
- Knappen **"Find alternativ"** foreslår alternativer ud fra muskelgruppe, bevægelsesmønster, tilgængeligt udstyr, præferencer og begrænsninger.
- Appen husker brugerens foretrukne alternativ til fremtidige træninger. Valget kan altid ændres.

**Sikkerhed ved smerte:** Smerte behandles anderledes end præferencer. Ved smerte skal øvelsen stoppes, appen må ikke fremstille et alternativ som medicinsk sikkert, må ikke stille diagnoser og skal anbefale professionel vurdering ved vedvarende eller betydelig smerte.

## 7. Automatisk progression (gratis kernefunktion)

- Første gang en øvelse udføres, vælger brugeren startvægt (gemmes som baseline). Appen fastsætter rep-mål og antal sæt.
- **Dobbelt progression:** fx 30 kg × 10 gentagelser → 11 → 12. Når øvre grænse nås med god teknik, øges vægten (i maskinens valgte vægttrin), og reps går tilbage til nedre grænse.
- Progression baseres på gennemførte træningspas, ikke kalenderuger.
- **Valgfri knap "Progression virkede ikke":** gentag sidste vellykkede niveau (samme vægt, reps og sæt) næste gang, uden automatisk nedsættelse eller nulstilling. Virker uafhængigt pr. øvelse. Ingen spørgeskema efter hver øvelse.
- **Opvarmningssæt** kan slås til.
- **Pauser:** Missede pas fremmer ikke progression. Ved kort pause fortsætter brugeren fra sidste niveau. Ved længere pause sænkes målene automatisk eller appen foreslår at vurdere startvægten igen.
- **Udvidet version (senere):** Hvis brugeren skifter til mere avanceret træningstype, fortsætter programmet ikke fra det grundlæggende. Maskinerne beholdes, men brugeren vælger startvægte på ny.

## 8. Onboarding

Kort og uden unødvendige spørgsmål:
1. Velkomst.
2. Opret profil.
3. Vælg erfaringsniveau.
4. Vælg mål.
5. Vælg 2, 3 eller 4 pas om ugen.
6. Søg efter eller opret center.
7. Scan eller bekræft udstyr (inkl. vægttrin).
8. Generér program.
9. Start første træning.

## 9. Navigation

- **Hjem:** næste træning, valgt center, fremdrift, hurtigstart.
- **Mit program:** ugeplan, øvelser og sæt, alternativer.
- **Mit center:** gemte centre, udstyr, tilføj/opdatér maskiner, scan udstyr.
- **Fremgang:** vægt- og rep-progression, gennemførte træninger, regelmæssighed, rekorder, grafer. Oversigt for uge, måned, 6 måneder og 12 måneder, med sammenligning med forrige periode.
- **Tips & tricks:** korte overskrifter med meget kort tekst (mind-muscle connection, rep-tempo osv.).
- **Profil:** personlige oplysninger, mål, præferencer, gemte alternativer, abonnement og indstillinger.

## 10. Udvidelse: flere træningstyper (senere)

Mulighed for en udvidet version til erfarne brugere, hvor man vælger træningstype: powerlifting, bodybuilding eller basistræning med mere fokus på frie vægte og stang. Se afsnit 7 om nulstilling af startvægte ved skift.

## 11. Design og brand

- Rent, minimalistisk, mobil-først, stærk typografi, høj læsbarhed, ensartede ikoner og tydelige øvelsesillustrationer.
- Professionelt, moderne og internationalt udtryk. Ikke barnligt eller aggressivt.
- Skal udtrykke tillid, viden, fremgang, motivation, enkelhed og pålidelighed.
- Tilgængeligt for brugere med lidt teknisk erfaring.

## 12. Økonomi

Appen er gratis at starte med og uden påtrængende reklamer. Målet er indtjening med **minimal løbende tid** fra min side.

**Gratis:** oprette/vælge centre, tilføje og scanne udstyr, delte udstyrsdatabaser, nybegynderprogrammer, maskininstruktioner, alternativer, automatisk progression, grundlæggende historik og fremgang.

**Premium (valgfrit):** avancerede programmer og periodisering, mere individuel AI-coaching, avanceret statistik, flere mål og specialprogrammer, avanceret tilpasning. Premium skal forbedre oplevelsen, ikke gøre gratisversionen ringere.

**Øvrige muligheder (kan udforskes):** samarbejde med fitnesscentre, sponsorerede onboarding-forløb, affiliate på udstyr/tilbehør, evt. personlig træner-marked, sponsorerede udfordringer. Sponsoreret indhold skal tydeligt markeres og være relevant.

Som supplement kan en begynderguide som PDF (med illustrationer af korrekt udførelse) udarbejdes til centrets medlemmer.

## 13. Teknik og arkitektur

- Skal fungere som webapp/PWA i mobilbrowser (Chrome). Billedtagning og galleri fungerer her, men ikke direkte inde i Claude-appen. Native iOS/Android senere.
- Sikker login, cloud-database, billedlager, delt center- og udstyrsdatabase, AI-genkendelse af udstyr, AI-assisteret programgenerering, abonnementsstyring, analyse.
- **Data må ikke gå tabt:** vedvarende lagring, backup/eksport, og sikker migrering ved opdateringer og udvidelser.
- GDPR-compliant.
- Skal understøtte mange centre, flere producenter, ækvivalente maskintyper og fællesskabsopdateringer.
- Hold øvelser, udstyrsdata og træningslogik adskilt og struktureret, så de kan forbedres uden at bygge appen om.

## 14. Videnskab og sikkerhed

- Anbefalinger bygger på pålidelig, nyeste evidens: fornuftigt nybegyndervolumen, realistisk progression, teknik først, restitution.
- Undgå ubegrundede sundhedsudsagn. Skeln klart mellem generel træningsvejledning og medicinsk rådgivning. Stil aldrig diagnoser.
- Bevar referencer til den forskning og de retningslinjer, der er brugt.

## 15. Udviklingsfaser

1. **MVP:** onboarding, centersøgning/oprettelse, udstyrsdatabase med fotogenkendelse og vægttrin, maskininstruktioner, programgenerering, alternativer, automatisk progression, grundlæggende træningslog.
2. **Fællesskab og forbedring:** fællesskabsverificering, flere gemte centre, bedre AI-genkendelse, flere demonstrationer, bedre fremgangsoversigter (uge/måned/6/12 mdr.), tips & tricks.
3. **Indtjening:** premium, avanceret AI-coach, centersamarbejde, affiliate, evt. trænermarked.
4. **Udvidelse:** flere træningstyper (powerlifting, bodybuilding, basistræning), avancerede programmer, flere sprog og centerdatabaser, avanceret analyse, sundhedsintegrationer.

## 16. Forventet leverance

Byg en **komplet fungerende app**, ikke blot et design eller klikbart prototype. Start med at definere teknisk arkitektur, databasestruktur, brugerflows og MVP-omfang. Byg derefter med:
- Fungerende navigation og brugerkonti.
- Vedvarende data.
- Fungerende center- og udstyrshåndtering (inkl. foto og vægttrin).
- Fungerende programgenerering.
- Træningslog med automatisk progression.
- Responsivt, mobil-først interface.

Brug realistiske eksempeldata, men adskil dem tydeligt fra verificerede data. Prioritér et stabilt, brugbart og skalerbart fundament frem for mange funktioner på én gang.

**Learn. Workout. Never Quit.**
