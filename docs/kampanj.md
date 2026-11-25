# Kampanjplan — 7 december 2026

**Tid:** måndag 7 december, 15:00:00. "Faran över" 15:05.
**Kvar:** 12 dagar (från 25 november).
**Vad som händer:** första nationella testet av SE-Alert. Alla kompatibla telefoner i Sverige larmar i tio sekunder, maxvolym, även på ljudlös. Ingen app, inget internet, ingen registrering.

## Varför just det här ögonblicket

1. **Alla tittar på sin telefon i exakt samma sekund.** Det är den största synkroniserade händelsen i svensk digitalhistoria, och den har ingen andra akt. Ingen har planerat 15:05.
2. **Larmet har inget namn.** Hesa Fredrik fick sitt av folk mun, inte av en myndighet.
3. **Det händer en gång.** Nästa test är inte nationellt, och nästa år är nyhetens behag borta.

## Tre akter

### Akt 1 — Döp larmet (25 nov → 7 dec 14:59)

En röstning. Sex namn, egna förslag, Discord-tråd. Vinnaren är det som får flest röster vid 14:59.

**Media-kroken:** "Sveriges telefoner får ett larm – vad ska det heta?" Går att skriva utan att förklara cell broadcast.

### Akt 2 — 15:00:00 (fem minuter)

Sajten blir en helskärm: *Viktigt meddelande till allmänheten*. Nedräkning till allclear. Inget mer. Folk sitter på sin telefon i fem minuter i alla fall.

**Krav:** statisk sida, förladdad, inget API-anrop. Hela landet öppnar samtidigt.

### Akt 3 — 15:05

*Faran över.* Vinnarnamnet avslöjas på samma skärm som alla just stirrade på. Sedan arkiv.

## Efteråt — det som lever vidare

- **Sveriges kör** — 100+ inspelningar från 15:00:00, mixade till ett spår och en karta. Alla filer startar i samma sekund.
- **Testharness** — öppen källkod för att simulera larmet och se vad som pajar i ens app. Den tråkiga nyttiga saken.
- **Tjutet som instrument** — webbsynth på larmets toner, album 15:05.

## Vad vi inte gör

- ❌ Falska larm som ser äkta ut. Myndigheterna är uttryckligen oroliga för det, och det slår mot funktionen som ska rädda liv.
- ❌ Något som lär folk stänga av varningar.
- ❌ "Vi hackade SE-Alert." Det gjorde vi inte.
- ❌ Myndigheternas logotyper eller avsändaridentitet.

## Trovärdighet

Varje sida bär raden: *Ett community-projekt från opensverige. Inte en myndighet. Inget här är ett larm.* Länk till krisinformation.se i sidfoten. Namnet som röstas fram är ett smeknamn – det officiella namnet bestämmer MCF.

## Källor

- [MCF – SE-Alert](https://www.mcf.se/en/advice-for-individuals/civil-defence-shelters-evacuation-and-warning-systems/public-service-announcement-and-other-varnings/se-alert)
- [Krisinformation.se – Varningslarmet SE-Alert testas](https://www.krisinformation.se/aktuellt/nyheter/varningslarmet-se-alert-testas)
- [Regeringen.se – SE-Alert testades för första gången](https://www.regeringen.se/pressmeddelanden/2026/09/se-alert-testades-for-forsta-gangen)
- [PTS – Snart testas SE-Alert](https://pts.se/nyheter-och-pressmeddelanden/snart-testas-se-alert--ny-kanal-for-vma)
