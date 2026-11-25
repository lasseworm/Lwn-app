import type { Metadata } from "next";
import Link from "next/link";

const KONTAKT_EMAIL = "lassewn@gmail.com";
const SUPABASE_REGION = "EU (Irland, eu-west-1)";

const SIDST_OPDATERET = "25. november 2026";

export const metadata: Metadata = {
  title: "Privatlivspolitik | LWN",
  description: "Sådan behandler lwn.dk dine personoplysninger.",
};

export default function PrivatlivPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 20px",
        lineHeight: 1.6,
      }}
    >
      <h1>Privatlivspolitik</h1>
      <p>
        <em>Sidst opdateret: {SIDST_OPDATERET}</em>
      </p>

      <h2>Hvem er ansvarlig</h2>
      <p>
        Lasse Worm Frost-Nielsen er dataansvarlig for de oplysninger, der
        behandles på lwn.dk.
        <br />
        Kontakt: <a href={`mailto:${KONTAKT_EMAIL}`}>{KONTAKT_EMAIL}</a>
      </p>

      <h2>Hvilke oplysninger vi indsamler</h2>
      <p>Når du opretter en konto eller logger ind, modtager vi:</p>
      <ul>
        <li>
          <strong>Ved login med Google:</strong> dit navn, din e-mailadresse og
          dit profilbillede fra din Google-konto. Vi får ikke adgang til din
          adgangskode eller til andre data i din Google-konto.
        </li>
        <li>
          <strong>Ved login med e-mail (magic link):</strong> din
          e-mailadresse.
        </li>
        <li>
          <strong>Tekniske oplysninger:</strong> tidspunkt for oprettelse og
          seneste login samt de oplysninger, der er nødvendige for at holde dig
          logget ind.
        </li>
      </ul>
      <p>Når du bruger appen, gemmer vi desuden:</p>
      <ul>
        <li>
          <strong>Dine træningsvalg:</strong> erfaringsniveau, mål, antal pas
          om ugen og om du vil se opvarmningssæt.
        </li>
        <li>
          <strong>Dine centre:</strong> hvilke fitnesscentre du har gemt, og
          hvilket der er dit aktive.
        </li>
        <li>
          <strong>Dit program og din træning:</strong> dine programmer, de pas
          og sæt du gennemfører (vægt og gentagelser), din progression pr.
          øvelse og de alternativer eller udeladelser, du vælger at gemme.
        </li>
        <li>
          <strong>Markering af smerte:</strong> hvis du trykker
          &quot;Smerte&quot; under en øvelse, gemmer vi kun, at øvelsen blev
          stoppet. Vi bruger det udelukkende til, at øvelsen ikke tæller med i
          din progression. Vi beder ikke om beskrivelser af smerter eller andre
          helbredsoplysninger, og vi stiller ingen diagnoser.
        </li>
        <li>
          <strong>Feedback:</strong> de beskeder, du sender via &quot;Giv
          feedback&quot;, sammen med hvilken side du sendte dem fra.
        </li>
        <li>
          <strong>Abonnement (LWN Pro):</strong> hvis du tegner Pro, gemmer vi
          abonnementets status og periode samt et kunde-id fra Stripe. Vi ser og
          gemmer aldrig dine kortoplysninger.
        </li>
        <li>
          <strong>Brug af AI-funktioner:</strong> hvor mange gange du har brugt
          AI-genkendelse, så vi kan overholde de grænser, der gælder for din
          plan.
        </li>
      </ul>

      <h2>Fælles oplysninger om centre og udstyr</h2>
      <p>
        LWN bygger på en fælles database over fitnesscentre og deres udstyr.
        Centre, maskiner, vægttrin, bekræftelser og fotos af udstyr, som du
        tilføjer, kan ses af andre indloggede brugere. De vises ikke med dit
        navn.
      </p>
      <ul>
        <li>
          <strong>Fotos må kun vise udstyr</strong> – ingen personer. Fotos
          bliver gjort mindre på din telefon, før de sendes, og al skjult
          information i billedfilen fjernes, herunder GPS-position og
          oplysninger om telefonen.
        </li>
        <li>
          Fotos gemmes i et privat lager og vises kun til indloggede brugere via
          tidsbegrænsede links.
        </li>
        <li>
          Fotos af en maskines vægtstak bruges kun til at aflæse vægttrinnene og
          slettes straks bagefter.
        </li>
      </ul>

      <h2>AI-genkendelse af udstyr</h2>
      <p>
        Hvis AI-genkendelse er slået til, sendes dit foto af en maskine eller
        en vægtstak til vores AI-leverandør Anthropic, som analyserer billedet
        og foreslår maskintype eller vægttrin. Hvis analysen viser, at billedet
        ikke forestiller udstyr eller viser en person, sletter vi det med det
        samme. Du kan altid vælge maskintypen selv i stedet for at bruge et
        foto.
      </p>

      <h2>Hvad oplysningerne bruges til</h2>
      <ul>
        <li>
          At oprette og drive din konto, sende dig login-mails og lave dit
          træningsprogram, din progression og dine oversigter over fremgang.
          Grundlaget er, at behandlingen er nødvendig for at levere den
          tjeneste, du har bedt om (databeskyttelsesforordningens artikel 6,
          stk. 1, litra b).
        </li>
        <li>
          At håndtere betaling for LWN Pro (artikel 6, stk. 1, litra b) og
          opfylde bogføringsreglerne (artikel 6, stk. 1, litra c).
        </li>
        <li>
          At beskytte login mod misbrug og at rette fejl og forbedre appen ud
          fra din feedback. Grundlaget er vores legitime interesse i en sikker
          og velfungerende tjeneste (artikel 6, stk. 1, litra f).
        </li>
      </ul>
      <p>
        Vi sælger ikke dine oplysninger, og vi deler dem ikke med andre til
        markedsføring eller andre formål.
      </p>

      <h2>Hvem der behandler oplysningerne for os</h2>
      <p>
        Vi bruger følgende leverandører, som behandler oplysninger på vores
        vegne:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> står for login, database og lagring af
          udstyrsfotos. Data opbevares i regionen {SUPABASE_REGION}.
        </li>
        <li>
          <strong>Vercel</strong> hoster hjemmesiden. Serverfunktioner kører i
          Frankfurt (EU).
        </li>
        <li>
          <strong>one.com</strong> sender login-mails fra vores domæne.
        </li>
        <li>
          <strong>Google</strong> håndterer selve login-trinnet, hvis du vælger
          at logge ind med Google.
        </li>
        <li>
          <strong>Cloudflare</strong> (Turnstile) beskytter login-formularen mod
          misbrug fra robotter. Når du åbner login-siden, modtager Cloudflare
          tekniske oplysninger om din browser og din IP-adresse til det formål.
          Oplysningerne bruges ikke til markedsføring.
        </li>
        <li>
          <strong>Stripe</strong> håndterer betaling og abonnement, hvis du
          tegner LWN Pro. Dine kortoplysninger går direkte til Stripe.
        </li>
        <li>
          <strong>Anthropic</strong> analyserer fotos af udstyr, hvis
          AI-genkendelse er slået til (se ovenfor).
        </li>
      </ul>
      <p>
        Nogle af leverandørerne er amerikanske virksomheder. Hvis oplysninger
        overføres til lande uden for EU/EØS, sker det med de garantier, som
        databeskyttelsesreglerne kræver, f.eks. EU-Kommissionens
        standardkontraktbestemmelser.
      </p>

      <h2>Cookies og lagring i browseren</h2>
      <p>
        Vi bruger kun cookies, der er nødvendige for, at du kan forblive logget
        ind. Under et træningspas gemmer browseren midlertidigt, hvilke øvelser
        du har markeret med &quot;Progression virkede ikke&quot;, og appen kan
        gemme sine egne filer (fx skrifttyper og ikoner), så den starter
        hurtigere. Vi bruger ikke cookies eller anden lagring til statistik
        eller markedsføring.
      </p>

      <h2>Hvor længe vi gemmer oplysningerne</h2>
      <p>
        Vi gemmer dine oplysninger, så længe du har en konto. Når kontoen
        slettes, sletter vi også din profil, dine programmer, al din
        træningshistorik, din progression, dine gemte alternativer, din
        feedback, oplysninger om dit abonnement og din brug af AI-funktioner.
      </p>
      <p>
        Centre, udstyr og udstyrsfotos, som du har bidraget med til den fælles
        database, bliver liggende, så andre brugere stadig kan bruge dem. De
        er ikke knyttet til dig efter sletningen. Har du haft LWN Pro, opbevarer
        Stripe betalingsoplysninger så længe, bogføringsreglerne kræver det.
      </p>

      <h2>Eksport, sletning og dine rettigheder</h2>
      <p>
        Under <Link href="/profil">Profil</Link> kan du selv:
      </p>
      <ul>
        <li>
          <strong>Eksportere dine data</strong> som en fil med alle dine
          oplysninger, programmer og din træningshistorik.
        </li>
        <li>
          <strong>Slette din konto</strong> med det samme. Har du et aktivt
          Pro-abonnement, skal det opsiges først, så du ikke bliver trukket
          penge for en slettet konto.
        </li>
      </ul>
      <p>
        Du kan også skrive til{" "}
        <a href={`mailto:${KONTAKT_EMAIL}`}>{KONTAKT_EMAIL}</a>, så sletter vi
        dine oplysninger hurtigst muligt og senest inden for 30 dage.
      </p>
      <p>
        Du har ret til indsigt i de oplysninger, vi har om dig, og ret til at
        få dem rettet, slettet eller udleveret. Du kan også gøre indsigelse mod
        behandlingen. Er du utilfreds med vores behandling af dine oplysninger,
        kan du klage til{" "}
        <a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer">
          Datatilsynet
        </a>
        .
      </p>

      <h2>Ændringer</h2>
      <p>
        Hvis vi ændrer denne privatlivspolitik, opdaterer vi datoen øverst på
        siden.
      </p>
    </main>
  );
}
