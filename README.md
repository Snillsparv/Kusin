# ⛱️ Kusinsemestern 2026 · Helligsø Strand

Hemsidan för årets kusinsemester i Danmark – **8–22 augusti 2026** på
Helligsøvej 2D, Helligsø Strand, 7760 Hurup Thy.

## Vad finns här?

- **Överblick** – datum, nedräkning, resenoteringar och ett schema över vem
  som är på plats när (enligt gruppchatten).
- **Stället** – karta, adress och tips om Thy, Limfjorden, Nationalpark Thy,
  Agger Tange och Cold Hawaii.
- **🏅 Lottningen** – den högtidliga och officiella lottningen av matlag:
  två personer per dag, 8–21 augusti. Med deltagarförteckning (§ 1),
  trumvirvel, konfetti och möjlighet att fastställa protokollet (§ 4) samt
  kopiera resultatet rakt in i gruppchatten.

Lottningen strävar efter rättvisa: jämnt antal pass per person utifrån hur
länge var och en är på plats, ingen står två dagar i rad och inga par
upprepas – i den mån matematiken tillåter. Resultatet sparas i webbläsaren
(localStorage) tills protokollet rivs upp.

## Köra lokalt

Det är en helt statisk sida – öppna `index.html` i en webbläsare, eller:

```bash
python3 -m http.server 8000
# öppna http://localhost:8000
```

## Publicera på GitHub Pages

1. Gå till repots **Settings → Pages**.
2. Under *Build and deployment*, välj **Deploy from a branch**.
3. Välj branch (t.ex. `main`) och mappen `/ (root)`. Spara.
4. Sidan dyker upp på `https://<användarnamn>.github.io/Kusin/` efter någon minut.

## Filer

| Fil | Innehåll |
| --- | --- |
| `index.html` | Sidans struktur och texter |
| `style.css` | All formgivning |
| `app.js` | Nedräkning, närvaroschema och lottningsmaskineriet |

*Byggd med kärlek för släkten. Vid tvist gäller Håkans kalender.*
