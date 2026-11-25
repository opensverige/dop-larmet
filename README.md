# Döp larmet

Den 7 december 2026 klockan 15:00 larmar varje kompatibel telefon i Sverige samtidigt. Tio sekunder, maxvolym, även på ljudlös. Det är första gången SE-Alert – cell broadcast – testas i hela landet.

Larmet har inget namn.

Den här sajten låter Sverige ge det ett.

> **Detta är ett community-projekt, inte en myndighet.** Inget här är ett larm, och ingenting här skickar något till någon telefon. Riktig information: [krisinformation.se](https://www.krisinformation.se).

---

## Varför

Hesa Fredrik – utomhussirenen – fick sitt namn av folk mun, inte av en myndighet. När Sveriges telefoner börjar låta i kör finns det inget namn att sätta på ljudet, ingen plats att prata om det, och ingen andra akt: klockan 15:05 dimper "Faran över" ner i tio miljoner fickor och sedan är det slut.

Sajten är byggd för att äga exakt de fem minuterna.

## Så funkar det

Tre akter, styrda av klockan. Ingen refresh, inget API-anrop i larmögonblicket.

| Akt | Tid | Vad som händer |
|---|---|---|
| `poll` | fram till 15:00:00 | Rösta på namnet. Egna förslag sparas lokalt. |
| `alarm` | 15:00:00 – 15:05:00 | Helskärm. "Viktigt meddelande till allmänheten." Nedräkning till allclear. |
| `clear` | 15:05 – midnatt | "Faran över." Vinnarnamnet avslöjas. |
| `archive` | efteråt | Samma sida, utan klocka. |

Förhandsvisa vilken akt som helst:

```
index.html?act=alarm     # 5 minuter blir 15 sekunder
index.html?act=clear
index.html?act=poll
```

## Köra lokalt

Inga beroenden, ingen build.

```bash
git clone https://github.com/opensverige/dop-larmet.git
cd dop-larmet
open index.html          # macOS
# eller
python3 -m http.server 8000
```

Sidan fungerar från `file://` också – allt är klassiska script, ingen `fetch` av datafiler.

Vill du se riktig räkning istället för localStorage:

```bash
python3 server/tally.py          # http://localhost:8787/tally
```

och sätt `api: "http://localhost:8787"` i `assets/config.js`.

## Deployment

**Sajten** är fyra statiska filer. Lägg `index.html` + `assets/` på vilken CDN som helst (Cloudflare Pages, Netlify, GitHub Pages, en VPS med nginx). Kravet är att den serveras förladdad och cachead – klockan 15:00:00 öppnar hela landet sajten samtidigt.

**Räknaren** är valfri. Utan den kör sajten i demoläge och röstar lokalt; det duger för en förhandsvisning men inte för en omröstning.

Två implementationer av samma API finns:

- `server/tally.py` – stdlib, en fil, för egen server eller lokal test.
  Persistar i `server/data/votes.json`. Kör bakom en reverse proxy om den ska ut.
- `server/worker.js` – Cloudflare Worker + Durable Object, för produktion.
  En DO-instans serialiserar rösterna, så inga uppdateringar tappas.

```bash
# Cloudflare (kräver wrangler)
cd server && wrangler deploy
```

Sätt sedan `api` i `assets/config.js` till worker-adressen och `ALLOWED_ORIGIN` i `worker.js` till din domän.

### API

```http
GET /tally?voter=<id>
→ {"votes":{"fick":12},"total":12,"mine":"fick"}

POST /tally/vote
{"id":"fick","voter":"<id>"}
→ {"votes":{"fick":13},"total":13,"mine":"fick"}
```

En röst per `voter` (slumpat id i localStorage). Röstar samma webbläsare igen flyttas rösten istället för att adderas. Servern accepterar bara id:n som finns i valsedeln.

## Designbeslut

- **Statisk först.** All logik som behövs 15:00:00 ligger i webbläsaren. Servern används bara före och efter.
- **Klockan är sanningen.** Inget cron-jobb som ska köra, inget state som kan fastna. Öppnar någon sidan 15:02 ser de larmet, inte röstningen.
- **Inga tunga beroenden.** Tre script, en CSS-fil, noll npm-paket. Går att läsa på en kvart.
- **Inget ljud som inte är opt-in.** Sajten spelar aldrig upp något själv.

## Gränser

Det här projektet får inte och ska inte:

- se ut som ett riktigt larm, eller skicka något som helst till en telefon
- uppmana någon att stänga av varningar
- använda myndigheternas logotyper, typsnitt eller formuleringar som om de vore avsändare
- kräva ett API-anrop i larmögonblicket

Namnet som röstas fram är ett smeknamn. Det officiella namnet är SE-Alert och det bestämmer Myndigheten för civilt försvar.

## Bidra

Se [CONTRIBUTING.md](CONTRIBUTING.md). Kort version: lägg till ett namn i `assets/candidates.js`, spegla id:t i serverns valsedel, öppna en PR.

## Licens

MIT. Se [LICENSE](LICENSE).
