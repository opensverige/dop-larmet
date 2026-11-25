# Bidra

Allt är en fil. Ingen build, inga beroenden, ingen godkännandeprocess.

## Lägga till ett namn

Namnet finns på tre ställen och måste finnas på alla tre:

1. `assets/candidates.js` – objektet som syns på sajten (`id`, `name`, `note`, `seed`)
2. `server/tally.py` – `BALLOT`-mängden
3. `server/worker.js` – `BALLOT`-mängden

`id` är gemener och bindestreck, max 32 tecken, och **byt aldrig ett id i efterhand** – det är nyckeln i röstdata.

`seed` används bara i demoläge. Sätt `0` för nya namn.

## Riktlinjer för namn

- Det ska gå att säga högt i radio utan att skämmas.
- Det ska låta som något en människa kommit på, inte en reklambyrå.
- Inga namn på nu levande personer, inga varumärken, inget som kan läsas som ett hot.

Vi tar inte in namn som anspelar på pågående kriser, krig eller attentat.

## Kod

- Vanlig JS, inga ramverk, ingen bundler. Det ska gå att öppna `index.html` direkt.
- `assets/app.js` får inte göra nätanrop under akt `alarm`. Den akten ska fungera med flygplansläge på.
- Tillgänglighet: allt klickbart ska vara en `button` eller `a`, fokus ska synas, och rörelse ska respektera `prefers-reduced-motion`.
- Svenska i gränssnittet, engelska i koden.

## PR

Liten diff, ett syfte, gärna en skärmbild om det syns. Trasigt är välkommet, tyst är det inte.
