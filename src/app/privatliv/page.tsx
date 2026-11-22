import type { Metadata } from "next";

const KONTAKT_EMAIL = "lassewn@gmail.com";
const SUPABASE_REGION = "EU (Irland, eu-west-1)";

const SIDST_OPDATERET = "22. november 2026";

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

      <h2>Hvad oplysningerne bruges til</h2>
      <p>
        Oplysningerne bruges kun til at oprette og drive din brugerkonto, så du
        kan logge ind og bruge siden, og til at sende dig login-mails.
        Grundlaget for behandlingen er, at den er nødvendig for at levere den
        tjeneste, du har bedt om (databeskyttelsesforordningens artikel 6, stk.
        1, litra b).
      </p>
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
          <strong>Supabase</strong> står for login og database. Data opbevares
          i regionen {SUPABASE_REGION}.
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
      </ul>
      <p>
        Nogle af leverandørerne er amerikanske virksomheder. Hvis oplysninger
        overføres til lande uden for EU/EØS, sker det med de garantier, som
        databeskyttelsesreglerne kræver, f.eks. EU-Kommissionens
        standardkontraktbestemmelser.
      </p>

      <h2>Cookies</h2>
      <p>
        Vi bruger kun cookies, der er nødvendige for, at du kan forblive logget
        ind. Vi bruger ikke cookies til statistik eller markedsføring.
      </p>

      <h2>Hvor længe vi gemmer oplysningerne</h2>
      <p>
        Vi gemmer dine oplysninger, så længe du har en konto. Når kontoen
        slettes, sletter vi også de tilknyttede oplysninger.
      </p>

      <h2>Sletning af konto og dine rettigheder</h2>
      <p>
        Skriv til <a href={`mailto:${KONTAKT_EMAIL}`}>{KONTAKT_EMAIL}</a>, hvis
        du vil have din konto og dine oplysninger slettet. Vi sletter dem
        hurtigst muligt og senest inden for 30 dage.
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
