# Lansering — checklista

Tid kvar från 25 november: **12 dagar**. Allt nedan är gjort eller bestämt innan 7 december 12:00, då fryser vi.

## T–12 till T–8: grunden

- [ ] Domän. Förslag: `doplarmet.se`, `larmet.nu`, `fickfredrik.se`. Kontrollera att namnet inte krockar med MCF/PTS.
- [ ] Sajten ut på CDN (Cloudflare Pages eller Netlify). Testa `?act=alarm` i mobil, Safari och Chrome.
- [ ] Räknaren deployad (`server/worker.js` eller `server/tally.py` bakom proxy), `api` satt i `assets/config.js`.
- [ ] `ALLOWED_ORIGIN` i worker satt till domänen, inte `*`.
- [ ] Valsedeln låst. Sex namn. Inga fler efter T–5.

## T–8 till T–3: rösterna

- [ ] Discord-tråd i `#projekt-show`, pinnad. Länk till sajten.
- [ ] Ett inlägg per dag som inte är "rösta nu" utan en åsikt om ett namn.
- [ ] Tipsa två journalister som skrivit om Hesa Fredrik tidigare. Ämne: *"Larmet har inget namn – vi frågar Sverige"*.
- [ ] Kolla att delningskortet ser okej ut i Slack, iMessage, X, LinkedIn (bild + titel).
- [ ] Skärmdump på `?act=alarm` som pressbild.

## T–2: hårdtest

- [ ] Öppna sajten med klockan 14:59:50 → röstningen låser sig.
- [ ] `?act=alarm` på en gammal iPhone och en Android.
- [ ] Flygplansläge på under akt `alarm` – allt ska fungera.
- [ ] Räknaren under last: `hey`/`ab` mot `/tally` med 200 samtidiga. Inga tappade röster.
- [ ] Backup: en statisk export av topplistan klockan 14:59, ifall räknaren dör.

## T–0: 7 december

- [ ] 14:59 — frys röstningen, ta en skärmdump av resultatet, posta den i Discord *före* 15:00.
- [ ] 15:00 — inget att göra. Sajten sköter sig. Sitt still i fem minuter.
- [ ] 15:05 — vinnaren syns automatiskt. Posta namnet i Discord, X, LinkedIn med skärmdump.
- [ ] 15:10 — tacka de som röstade, länka till krisinformation.se en sista gång.

## Efter

- [ ] Sätt `data-act` till arkiv permanent (eller låt klockan göra det).
- [ ] Posta röstsiffrorna öppet, inklusive hur många röster som flyttades.
- [ ] Bestäm om namnet ska skickas in till MCF som ett medborgarförslag. Kul om de svarar.

## Om något går fel

- **Räknaren dör:** sajten visar seedsiffror. Byt till en statisk resultatbild och var öppen med det.
- **Någon anklagar oss för falskt larm:** svara med skärmdump på disclaimern och länken till krisinformation.se. Ta bort inget.
- **Myndigheten hör av sig:** de har rätt. Byt namn på projektet om de ber om det. Det är ett skämt, inte en kamp mot MCF.
