/* ==========================================================================
   Döp larmet — assets/config.js
   Enda filen du behöver röra för att sätta sajten i drift.

   API: lämna tom för demoläge (röster sparas bara i webbläsaren).
        Sätt till din tjänst, t.ex. "https://tally.doplarmet.se", för riktig räkning.
        Servern ska svara på GET /tally och POST /tally/vote — se server/.
   ========================================================================== */

window.DOPLARMET_CONFIG = {
  // Tom sträng = demoläge. Exempel: "https://doplarmet-tally.example.workers.dev"
  api: "",

  // Var riktiga namnförslag ska diskuteras.
  discord: "https://discord.gg/ZbV4qB34um",

  // Sidans publika adress, används i delningstexter.
  site: "doplarmet.se"
};
