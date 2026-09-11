// Krantjuweel — de inhoud van de kaart.
//
// Elk stuk is een { ... } in de lijst hieronder. Velden:
//
//   id        verplicht en uniek; alleen kleine letters, cijfers en streepjes. Wordt de link: index.html#id
//   type      "article" (standaard) of "image"
//   title     verplicht
//   author    naam zoals die in de krant komt
//   kind      soort stuk, staat klein boven de titel: "gedicht", "verslag", "recept", "linosnede", ...
//   date      "JJJJ-MM-DD" — bepaalt de volgorde; automatisch geplaatste nieuwe stukken komen verder van het midden
//   size      "s", "m" of "l" — hoe groot het kaartje op de kaart is
//   x, y      plek op de kaart in pixels ten opzichte van het midden (x naar rechts, y naar beneden).
//             Laat ze weg om het stuk automatisch een vrije plek te geven.
//             Tip: open index.html?edit, sleep de stukken waar je ze wilt en kopieer de coördinaten.
//   rotate    scheefheid in graden (anders een klein toevallig hoekje)
//   excerpt   korte tekst op het kaartje (anders het begin van de body)
//   image     pad naar een afbeelding — verplicht bij type "image", bij een artikel wordt het de kopfoto
//   alt       beschrijving van de afbeelding voor wie hem niet ziet
//   caption   onderschrift bij de afbeelding in de lezer
//   aspect    breedte gedeeld door hoogte van de afbeelding, bv. 1.5 — helpt bij automatisch plaatsen
//   body      de tekst. Lege regel = nieuwe alinea. Regeleinden binnen een alinea blijven staan.
//             Verder mag: # kop, > citaat, - lijstje, 1. lijstje, ---, **vet**, *schuin*,
//             [tekst](https://...), ![beschrijving](content/images/foto.jpg)
//
// Tekst tussen `backticks` mag over meerdere regels lopen; gebruik daarbinnen geen losse backtick.

window.KRANTJUWEEL = {
  items: [
    {
      id: "zelf-iets-insturen",
      kind: "oproep",
      title: "Zelf iets insturen?",
      author: "de redactie",
      date: "2026-08-15",
      size: "s",
      x: 0, y: -310,
      body: `
Krantjuweel wordt gemaakt door wie meedoet. Iedereen die iets te vertellen, te laten zien of te bezweren heeft mag één stuk per keer insturen: een tekst, een gedicht, een tekening, een foto, een recept.

- Tekst: tot ongeveer 800 woorden, als los bestand of gewoon in de mail.
- Beeld: een foto of scan, zo groot als je hem hebt.
- Zet erbij hoe je naam in de krant moet komen — of dat je liever geen naam wilt.

Stuur het naar [redactie@krantjuweel.nl](mailto:redactie@krantjuweel.nl). De redactie legt je stuk ergens op de kaart. Waar precies mag je erbij zeggen.
`,
    },

    {
      id: "ode-aan-de-modder",
      kind: "gedicht",
      title: "Ode aan de modder",
      author: "Marijke van der Weide",
      date: "2026-08-21",
      size: "s",
      x: -520, y: -170,
      excerpt: "Je zuigt aan mijn laarzen\nalsof je me wilt houden,\nen eerlijk gezegd: ik blijf.",
      body: `
Je zuigt aan mijn laarzen
alsof je me wilt houden,
en eerlijk gezegd: ik blijf.

Wie zei dat een feest
op het droge moet beginnen?
Alles wat groeit begint bij jou.

Morgen ben je weer gewoon grond,
hard en zwijgzaam onder de fietsen,
maar vannacht dans je mee —
tot aan mijn knieën.
`,
    },

    {
      id: "hoe-vouw-je-een-krant-tot-een-boot",
      kind: "handleiding",
      title: "Hoe vouw je een krant tot een boot",
      author: "Tobias Kool",
      date: "2026-08-24",
      size: "m",
      x: 540, y: -240,
      body: `
Een krant die je uit hebt is geen afval maar bouwmateriaal. Dit is de klassieke boot, zoals mijn opa hem vouwde aan de rand van het Noordzeekanaal.

1. Neem één dubbel vel en leg het dicht voor je, met de vouw naar boven.
2. Vouw de twee bovenhoeken naar het midden, zodat er een punt ontstaat. Het lijkt nu op een dak.
3. Vouw de onderste strook omhoog, aan beide kanten. Je hebt een hoed. Zet hem gerust even op.
4. Pak de hoed bij de zijkanten, trek hem open en druk hem plat tot een vierkant.
5. Vouw de onderste punt omhoog, draai om, en nog eens. Weer een driehoek.
6. Open opnieuw, druk plat, en trek nu voorzichtig de twee bovenste punten uit elkaar.

Klaar. Zet hem in het water en kijk hoe lang hij het volhoudt. Krantjuweel zelf drijft overigens niet; die is te zwaar van de juwelen.

> Een boot van papier gaat hooguit één keer mee. Dat is precies genoeg.
`,
    },

    {
      id: "zonnewiel",
      type: "image",
      kind: "linosnede",
      title: "Zonnewiel",
      author: "Anouk Berkhout",
      date: "2026-08-26",
      size: "m",
      x: -580, y: 250,
      image: "content/images/zonnewiel.svg",
      alt: "Een zonnewiel in zwart, goud en rood: ringen met stralen eromheen.",
      caption: "Linosnede, 40 × 40 cm, gedrukt op oud krantenpapier.",
      aspect: 1,
      body: `
Gesneden in de week voor het festival, gedrukt op de keukentafel met een pollepel als pers. De eerste drie afdrukken mislukten; de vierde hangt nu boven het fornuis.
`,
    },

    {
      id: "de-nacht-dat-de-kerk-zong",
      kind: "verslag",
      title: "De nacht dat de kerk zong",
      author: "Redactie",
      date: "2026-08-28",
      size: "l",
      x: 60, y: 380,
      body: `
Het begon met één stem, achterin, bij de deur. Niemand wist van wie. Tegen middernacht zong het hele gebouw.

## Hoe het ging

Er stond geen programma. Iemand had een harmonium naar binnen gerold, iemand anders had er kaarsen omheen gezet, en de rest gebeurde vanzelf. Liederen die iedereen half kende werden hele liederen, omdat er altijd wel iemand was die het volgende couplet nog wist.

Om twee uur werd het stil. Niet omdat het op was, maar omdat het genoeg was. Buiten stonden de fietsen als slapende dieren tegen elkaar geleund.

> "Ik dacht dat ik niet kon zingen," zei een man met een hoed. "Blijkt dat je alleen niet alléén moet zingen."

## Wat we ervan onthouden

Dat een gebouw pas een gebouw is als het geluid maakt. En dat er volgend jaar iemand het harmonium moet stemmen.
`,
    },

    {
      id: "brandnetelsoep-voor-veertig-man",
      kind: "recept",
      title: "Brandnetelsoep voor veertig man",
      author: "Oom Ferry",
      date: "2026-09-02",
      size: "m",
      // geen x/y: dit stuk krijgt automatisch een vrije plek
      body: `
Pluk de brandnetels met handschoenen, en alleen de bovenste vier blaadjes. Alles daaronder is bitter en heeft al te veel meegemaakt.

- 4 volle emmers jonge brandneteltoppen
- 3 kilo aardappels
- 8 uien en 2 bollen knoflook
- een halve kilo boter (echte)
- 10 liter water of bouillon
- zout, peper, nootmuskaat
- een fles witte wijn, waarvan de helft voor de kok

Fruit de ui en knoflook in de boter tot ze zacht zijn en de hele wei ruikt. Aardappels in blokjes erbij, even meebakken, dan het water. Twintig minuten koken. Brandnetels erbij, nog vijf minuten — langer niet, dan wordt de soep bruin en droevig. Pureren met de staafmixer, of met een schone stok en veel geduld.

Serveer met brood en met wie er toevallig is.
`,
    },

    {
      id: "kaart-van-het-niets",
      type: "image",
      kind: "tekening",
      title: "Kaart van het niets",
      author: "Lot",
      date: "2026-09-04",
      size: "l",
      // geen x/y: dit stuk krijgt automatisch een vrije plek
      image: "content/images/kaart-van-het-niets.svg",
      alt: "Een getekend kaartje met hoogtelijnen, een gestippelde route, een kompas en een rood kruis.",
      caption: "Inkt en potlood, uit een schetsboek dat nat is geweest.",
      aspect: 1.333,
    },

    {
      id: "over-het-woord-juweel",
      kind: "ingezonden brief",
      title: "Over het woord juweel",
      author: "Een lezer",
      date: "2026-09-06",
      size: "s",
      x: 590, y: 170,
      body: `
Geachte redactie,

Een juweel is een steen die iemand heeft opgeraapt en heeft besloten te bewaren. Dat is alles. Het glimmen komt later, van het vasthouden.

Dat leek me een goede naam voor een krant.

Met vriendelijke groet,
*een lezer die liever niet in de krant staat*
`,
    },
  ],
};
