# ⛱️ Kusinsemestern 2026 · Helligsø Strand

Hemsidan för årets kusinsemester i Danmark: **8–22 augusti 2026** på
Helligsøvej 2D, Helligsø Strand, 7760 Hurup Thy.

## Vad finns här?

Sajten är uppdelad på sju sidor med gemensam meny:

- **Överblick** (`index.html`): släktens spoof-reklamfilm (»Kusinsemestern –
  dagarna du minns«, `kusinfilmen.mp4`) inbäddad överst, datum, nedräkning,
  resenoteringar och ett
  schema över vem som är på plats när (enligt gruppchatten). Obs: filnamnet
  och CSS-klasserna (`.filmruta*`) undviker med flit ordet »reklam« –
  annonsblockerarnas svenska filterlistor döljer annars hela filmen på
  datorer med blockerare. Döp inte tillbaka dem.
- **Stället** (`stallet.html`): karta, adress och info om Helligsø Strand,
  Nissum Bredning och närområdet.
- **Aktiviteter** (`aktiviteter.html`): utflykter och upplevelser i Thy –
  bad, Nationalpark Thy, Cold Hawaii, Thyborøn, sälsafari, Vestervig kirke,
  skaldjur med mera.
- **Action** (`action.html`): gokart, kabelwakeboard, fallskärmshopp, Fårup
  Sommerland med mera, med en interaktiv karta (Leaflet + OpenStreetMap,
  ligger lokalt i `vendor/leaflet/`) där aktiviteterna kan filtreras per
  kategori.
- **🏄 Surfande släktingar**: släktens huvuden surfar genom sidhuvudet på
  varje sida. Klicka på en surfare så hoppar hen till och ropar sin
  catchphrase i en pratbubbla (fraserna ligger i `SURF_FRASER` i `app.js`).
  Med jämna mellanrum ropar någon självmant, så att besökaren förstår
  att de går att klicka på.
- **🎬🕰️ Otto vid klockan**: klick på nedräkningen på startsidan öppnar en
  film där Otto sjunger en tidsenlig låt (`otto.mp4`). Otto är filmad mot
  svart bakgrund; den svarta bakgrunden nycklas bort i realtid med en liten
  WebGL-shader (`setupOttoKlockan` i `app.js`), så att bara Otto syns. Knepet
  fungerar i alla webbläsare inklusive iPhone, till skillnad från äkta
  alfa-video.
- **🐛🔥 Larven från helvetet**: då och då kryper ekprocessionsspinnaren in
  på sidan. Klicka på den för eldkastare, med explosionsdån (WebAudio) och
  ett växlande demonstrationsplakat.
- **🛒 För matlagen** (`matlagen.html`): matlagens handlingsguide – butiker
  nära Helligsø sorterade efter restid, vad varje butikstyp har, var de
  veganska basvarorna finns (Oatly, Alpro, Naturli', tofu), bageri- och
  fisktips samt praktiska råd om pant, kort och öppettider.
- **🕶️ Jojjes danskskola!** (`danskskolan.html`): MC Jojje lär släkten den
  viktigaste danska slangen i dansk hiphop-stil – tolv spår med uttal och
  riktig, native dansk uppläsning (förgenererade klipp i `dansk/`, med
  webbläsarens talsyntes som reserv), boom bap-beat byggd i WebAudio
  (på som standard – startar vid första klicket/trycket enligt webbläsarnas
  autoplay-policy) och en högtidlig eksamen med rank och konfetti.
- **🌴 Korsika 2027** (`korsika.html`): drömsidan inför nästa års
  kusinsemester, med vetenskaplig jämförelse mot Danmark och sex
  fotorealistiska vykort (AI-frammanade åt Drömkommissionen, ligger i
  `img/korsika/`) att drömma sig bort till under regniga Danmarksdagar.
- **🏅 Lottningen** (`lottningen.html`): den högtidliga och officiella
  lottningen av matlag. Två personer per dag, 8–21 augusti, med
  deltagarförteckning (§ 1), trumvirvel, konfetti, fastställande av
  protokollet (§ 4) och en knapp som kopierar resultatet rakt in i
  gruppchatten.

Lottningen strävar efter rättvisa: jämnt antal pass per person utifrån hur
länge var och en är på plats, ingen står två dagar i rad och inga par
upprepas, i den mån matematiken tillåter. Resultatet sparas i webbläsaren
(localStorage) tills protokollet rivs upp.

Själva förrättandet kräver kommissionens lösenord (skrivs med VERSALER).
Lösenordet ligger inte i klartext i koden utan jämförs som SHA-256-hash,
och gäller sedan hela webbläsarsessionen.

## Släktkontrollen (🛂)

Första besöket i en ny webbläsare möts av gränskontrollen: tre slumpade
frågor ur släktens gemensamma minne (av sex möjliga, definierade i
`SLAKT_FRAGOR` i `app.js`). Alla tre rätt bevisar släktskapet — beviset
sparas i localStorage och på den enheten visas testet aldrig igen. Fel
svar ger en ny slumpad omgång, i all oändlighet.

## Alice födelsedagsspel (🎂)

Den 26 juli (Alices födelsedag) dyker tårtjakten upp: ett festband under
menyn som startar spelet när man klickar på det – spelet tränger sig
aldrig på självmant (`setupAliceFodelsedag` i `app.js`, sprites i
`img/spel/`). Historien:
Håkan och Jonas har bakat en vegansk tårta men Håkan glömde sockret –
innan jakten väljer man vem i släkten man spelar som (det huvudet blir
spelaren), styr med finger/mus/piltangenter och ska fånga tio riktiga
vegantårtor med socker medan man undviker de sockerfria (som kostar två
poäng). Spelet är avsiktligt extremt svårt: jägaren har toppfart, tårtorna
vinglar i vinden och faller snabbare för varje poäng. Fyra av jägarna
(Ann, A-K, Lena och Lars-Åke) spelar i ett mänskligare tempo – sex tårtor
i stället för tio, beskedligare fall, mindre vind, snabbare ben, större
korg och halverat straff (`LUGNT_TEMPO` i `app.js`). Vinsten och
partyhatten är exakt lika hedrande. Vinst ger
emojikonfetti, stort grattis – och en **partyhatt** på vinnarens surfare
resten av dagen. På själva födelsedagen publiceras hatten dessutom
**automatiskt för alla besökare**, via samma mekanism som ✏️-pennan
(vinnarlistan committas datummärkt till `hattar.json` och gäller bara
vinstdagen). Nyckelfrasen som låser upp publiceringen ligger inbakad i
`app.js`, förklädd så att den inte går att greppa fram – men en
målmedveten kodläsare kan förstås vaska fram den; det är en medveten
avvägning för en familjesajt, och GitHub-nyckeln kan alltid återkallas.
Förhandstitt: lägg till ?tartjakt i adressen – vinster utanför
födelsedagen syns bara i den egna webbläsaren.

## SvampBob i djupet (🧽)

Den som skrollar ända ner till sidans botten belönas: SvampBob kikar upp
över nederkanten på ett nytt slumpat ställe varje gång (spegelvänd om han
hamnar på vänstra halvan), gapskrattar sitt na-ha-ha-ha-ha-ha-ha (två
bildrutor i växeldrift, `img/ansikten/svamp1.webp` och `svamp2.webp`, plus
släktens egen `skratt.mp3`) och dyker ner igen. Klickar man på honom
avbryts skrattet och han åker ner direkt. Ljudet kräver att besökaren har
klickat någon gång på sidan — annars skrattar han tyst.

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
- **Lösenordsläget**: under »Avancerat« i panelen kan den som har en
  GitHub-nyckel aktivera lösenordsläget (engångssteg). Nyckeln krypteras
  då med ett valfritt lösenord (PBKDF2 600 000 varv + AES-GCM) och läggs i
  repot som `nyckel.json`. Därefter räcker det att skriva lösenordet i
  panelen för att publicera — nyckeln dekrypteras i webbläsaren och sparas
  bara för sessionen. Obs: den krypterade filen är offentlig, så skyddet
  är aldrig starkare än lösenordet. Nyckeln kan alltid återkallas på
  GitHub om något går snett.
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
| `matlagen.html` | Matlagens handlingsguide: butiker, sortiment, veganskt |
| `danskskolan.html` | Jojjes danskskola med slang, beat och eksamen |
| `korsika.html` | Drömsidan inför Korsika 2027 |
| `lottningen.html` | Den högtidliga matlagslottningen |
| `style.css` | All formgivning (delas av alla sidor) |
| `app.js` | Släktkontrollen, nedräkning, närvaroschema, actionkartan, surfarna och lottningsmaskineriet – varje del körs bara på den sida där den hör hemma |
| `img/` | Släktens ansikten, surfarkroppar och Korsikavykorten |
| `vendor/leaflet/` | Kartbiblioteket Leaflet 1.9.4 (lokalt, ingen CDN) |
| `CNAME` | Domänen för GitHub Pages |

*Byggd med kärlek för släkten. Vid tvist gäller Håkans kalender.*
