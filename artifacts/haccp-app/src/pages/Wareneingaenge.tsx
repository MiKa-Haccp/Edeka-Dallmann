import WareneingaengeBase, { type WEBaseConfig, type CritDef } from "./WareneingaengeBase";

const ALL_CRIT: CritDef[] = [
  { key:"hygiene",           short:"Hygiene",     label:"Hygiene LKW / Fahrer i.O.",                          type:"check", note:"entfällt bei Nachtanlieferung", group:"Allgemein" },
  { key:"etikettierung",     short:"Etikett.",    label:"Etikettierung / Verpackung i.O.",                    type:"check", group:"Allgemein" },
  { key:"qualitaet",         short:"Qualität",    label:"Qualität / Aussehen i.O.",                           type:"check", group:"Allgemein" },
  { key:"mhd",               short:"MHD",         label:"MHD / Verbrauchsdatum i.O.",                         type:"check", group:"Allgemein" },
  { key:"rindfleisch",       short:"Rindfl.",     label:"Rindfleischetikettierung i.O.",                      type:"check", group:"Rindfleisch" },
  { key:"kistenetikett",     short:"Kiste",       label:"Kistenetikett vorhanden i.O.",                       type:"check", group:"Obst & Gemüse" },
  { key:"qs_biosiegel",      short:"Biosiegel",   label:"Bayerisches Biosiegel geprüft i.O.",                 type:"check", group:"QS-Systeme" },
  { key:"qs_by",             short:"QS-BY",       label:"Geprüft. Qualität BY geprüft i.O.",                  type:"check", group:"QS-Systeme" },
  { key:"qs_qs",             short:"QS",          label:"QS - Qualität u. Sicherheit i.O.",                   type:"check", group:"QS-Systeme" },
  { key:"bio_zertifikat",    short:"Bio-Zert.",   label:"Bio: Zertifikat Lieferant geprüft",                  type:"check", group:"Bio-Ware" },
  { key:"bio_kennz",         short:"Bio-Kennz.",  label:"Bio: Kennzeichnung Ware geprüft",                    type:"check", group:"Bio-Ware" },
  { key:"bio_warenbegleit",  short:"Bio-WB",      label:"Bio: Angaben Warenbegleitpapiere",                   type:"check", group:"Bio-Ware" },
  { key:"bio_geliefert",     short:"Bio-Lief.",   label:"Bio: Gelieferte Ware = bestellte Ware",              type:"check", group:"Bio-Ware" },
  { key:"bio_kennz_stimmt",  short:"Bio-LS",      label:"Bio: Kennzeichnung stimmt mit Lieferschein",         type:"check", group:"Bio-Ware" },
  { key:"bio_vermischung",   short:"Bio-Mix",     label:"Bio: keine Vermischung mit konv. Ware",              type:"check", group:"Bio-Ware" },
  { key:"temp_arznei",         short:"Arznei",      label:"Temp. Arzneimittel (15-25 C)",                       type:"temp", minVal:15, maxVal:25, group:"Temperatur" },
  { key:"temp_kuehl_molkerei", short:"Molkerei",    label:"Temp. Molkerei / Feinkost (max. +7 C)",             type:"temp", maxVal:7,  group:"Temperatur" },
  { key:"temp_kuehl_og",       short:"OG-Temp",     label:"Temp. Gemüse / Obstsalate (max. +7 C)",             type:"temp", maxVal:7,  group:"Temperatur" },
  { key:"temp_tk",             short:"TK",           label:"Temp. Tiefkühlware (max. -18 C)",                  type:"temp", maxVal:-18, group:"Temperatur" },
  { key:"temp_hackfleisch",    short:"Hackfl.",     label:"Temp. SB-Hackfleisch (max. +2 C)",                  type:"temp", maxVal:2,  group:"Temperatur" },
  { key:"temp_innereien",      short:"Innereien",   label:"Temp. Innereien (max. +3 C)",                       type:"temp", maxVal:3,  group:"Temperatur" },
  { key:"temp_gefluegel",      short:"Geflügel",    label:"Temp. Geflügel / Farmwild (max. +4 C)",             type:"temp", maxVal:4,  group:"Temperatur" },
  { key:"temp_fleisch",        short:"Fleisch",     label:"Temp. sonstiges Fleisch (max. +7 C)",               type:"temp", maxVal:7,  group:"Temperatur" },
  { key:"temp_frischfisch",    short:"Frischfisch", label:"Temp. Frischfisch (max. +2 C)",                     type:"temp", maxVal:2,  group:"Temperatur" },
  { key:"temp_fischverarbeit", short:"Fisch-V.",    label:"Temp. verarbeitete Fischerzeugnisse (max. +7 C)",   type:"temp", maxVal:7,  group:"Temperatur" },
  { key:"temp_muscheln",       short:"Muscheln",    label:"Temp. Muscheln lebend (max. +10 C)",                type:"temp", maxVal:10, group:"Temperatur" },
];

const CONFIG: WEBaseConfig = {
  section: "wareneingaenge",
  pageTitle: "Wareneingänge",
  pageSubtitle: "Wareneingangskontrolle - alle Lieferanten",
  allCrit: ALL_CRIT,
  updateEvent: "wareneingaenge-updated",
  backHref: "/category/2",
};

export default function Wareneingaenge() {
  return <WareneingaengeBase config={CONFIG} />;
}
