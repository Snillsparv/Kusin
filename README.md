# ⛱️ Kusinsemestern 2026 · Helligsø Strand

Hemsidan för årets kusinsemester i Danmark: **8–22 augusti 2026** på
Helligsøvej 2D, Helligsø Strand, 7760 Hurup Thy.

## Vad finns här?

- **Överblick**: datum, nedräkning, resenoteringar och ett schema över vem
  som är på plats när (enligt gruppchatten).
- **Stället**: karta, adress och tips om Thy, Limfjorden, Nationalpark Thy,
  Agger Tange och Cold Hawaii.
- **🏅 Lottningen**: den högtidliga och officiella lottningen av matlag.
  Två personer per dag, 8–21 augusti, med deltagarförteckning (§ 1),
  trumvirvel, konfetti, fastställande av protokollet (§ 4) och en knapp
  som kopierar resultatet rakt in i gruppchatten.

Lottningen strävar efter rättvisa: jämnt antal pass per person utifrån hur
länge var och en är på plats, ingen står två dagar i rad och inga par
upprepas, i den mån matematiken tillåter. Resultatet sparas i webbläsaren
(localStorage) tills protokollet rivs upp.

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
| `index.html` | Sidans struktur och texter |
| `style.css` | All formgivning |
| `app.js` | Nedräkning, närvaroschema och lottningsmaskineriet |
| `CNAME` | Domänen för GitHub Pages |

*Byggd med kärlek för släkten. Vid tvist gäller Håkans kalender.*
