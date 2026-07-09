# ⛱️ Kusinsemestern 2026 · Helligsø Strand

Hemsidan för årets kusinsemester i Danmark: **8–22 augusti 2026** på
Helligsøvej 2D, Helligsø Strand, 7760 Hurup Thy.

## Vad finns här?

Sajten är uppdelad på fem sidor med gemensam meny:

- **Överblick** (`index.html`): datum, nedräkning, resenoteringar och ett
  schema över vem som är på plats när (enligt gruppchatten).
- **Stället** (`stallet.html`): karta, adress och info om Helligsø Strand,
  Nissum Bredning och närområdet.
- **Aktiviteter** (`aktiviteter.html`): utflykter och upplevelser i Thy –
  bad, Nationalpark Thy, Cold Hawaii, Thyborøn, sälsafari, Vestervig kirke,
  skaldjur med mera.
- **Action** (`action.html`): gokart, kabelwakeboard, fallskärmshopp, Fårup
  Sommerland med mera, med en interaktiv karta (Leaflet + OpenStreetMap,
  ligger lokalt i `vendor/leaflet/`) där aktiviteterna kan filtreras per
  kategori.
- **🌴 Korsika 2027** (`korsika.html`): drömsidan inför nästa års
  kusinsemester, med vetenskaplig jämförelse mot Danmark och vykort att
  drömma sig bort till under regniga Danmarksdagar.
- **🏅 Lottningen** (`lottningen.html`): den högtidliga och officiella
  lottningen av matlag. Två personer per dag, 8–21 augusti, med
  deltagarförteckning (§ 1), trumvirvel, konfetti, fastställande av
  protokollet (§ 4) och en knapp som kopierar resultatet rakt in i
  gruppchatten.

Lottningen strävar efter rättvisa: jämnt antal pass per person utifrån hur
länge var och en är på plats, ingen står två dagar i rad och inga par
upprepas, i den mån matematiken tillåter. Resultatet sparas i webbläsaren
(localStorage) tills protokollet rivs upp.

## Personalisera texterna (✏️-pennan)

Alla sidor har en diskret penna nere till höger. Den öppnar ett
redigeringsläge där man klickar på valfri text och skriver om den direkt
på sidan.

- **Utkast** sparas i den egna webbläsaren (localStorage) och syns bara där.
- **Publicera för alla** committar ändringarna till `anpassningar.json` i
  det här repot via GitHub-API:t, varpå GitHub Pages deployar om och alla
  ser dem inom någon minut. Det kräver en *fine-grained personal access
  token* med skrivrätt till Contents i just detta repo (skapas under
  GitHub → Settings → Developer settings). Nyckeln sparas bara i den egna
  webbläsaren.
- Ändringarna nycklas på ursprungstextens innehåll: om en standardtext
  senare ändras i HTML:en slutar den gamla anpassningen gälla i stället
  för att hamna fel.
- Publiceringen sker mot branchen i `EDIT_BRANCH` i `app.js`. Byts
  Pages-branchen måste konstanten uppdateras.

## Köra lokalt

Det är en helt statisk sida. Öppna `index.html` i en webbläsare, eller:

```bash
python3 -m http.server 8000
# öppna http://localhost:8000
```

## Publicera på kusinsemestern.se (GitHub Pages + Loopia)

Sidan hostas gratis på GitHub Pages och domänen pekas dit från Loopia.
Filen `CNAME` i repot talar om för GitHub att sidan ska svara på
`kusinsemestern.se`.

**1. Slå på GitHub Pages**

1. Se till att sajtfilerna ligger på den branch du vill publicera från
   (enklast: slå ihop till `main`).
2. Gå till repots **Settings → Pages**.
3. Under *Build and deployment*: välj **Deploy from a branch**, branchen
   (t.ex. `main`) och mappen `/ (root)`. Spara.
4. Skriv `kusinsemestern.se` i fältet **Custom domain** och spara.

**2. Peka domänen i Loopia**

Logga in i Loopia Kundzon, välj domänen `kusinsemestern.se` och öppna
**DNS-inställningar** (zonredigeraren):

1. Ta bort befintliga A-poster på `@` (de pekar på Loopias parkeringssida).
2. Lägg till fyra A-poster på `@` (GitHub Pages fasta adresser):
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Lägg till en CNAME-post på `www` som pekar på `snillsparv.github.io.`

**3. Vänta och slå på HTTPS**

DNS-ändringen slår igenom inom någon timme. När GitHub Pages-sidan visar
att domänen är verifierad: bocka i **Enforce HTTPS** (certifikatet ordnas
automatiskt, kan ta upp till ett dygn första gången).

Klart! Sidan uppdateras sedan automatiskt vid varje push till den valda
branchen.

## Filer

| Fil | Innehåll |
| --- | --- |
| `index.html` | Överblick (hero, nedräkning, närvaroschema, resenoteringar) |
| `stallet.html` | Stället (adress, karta, info om platsen) |
| `aktiviteter.html` | Utflykter &amp; aktiviteter |
| `action.html` | Action med interaktiv karta |
| `korsika.html` | Drömsidan inför Korsika 2027 |
| `lottningen.html` | Den högtidliga matlagslottningen |
| `style.css` | All formgivning (delas av alla sidor) |
| `app.js` | Nedräkning, närvaroschema, actionkartan och lottningsmaskineriet – varje del körs bara på den sida där den hör hemma |
| `vendor/leaflet/` | Kartbiblioteket Leaflet 1.9.4 (lokalt, ingen CDN) |
| `CNAME` | Domänen för GitHub Pages |

*Byggd med kärlek för släkten. Vid tvist gäller Håkans kalender.*
