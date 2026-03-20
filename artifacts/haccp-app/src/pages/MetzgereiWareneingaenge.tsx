import WareneingaengeBase, { type WEBaseConfig, type CritDef } from "./WareneingaengeBase";

// Alle verfuegbaren Kriterien fuer die Metzgerei (Fleisch + Fisch)
const ALL_CRIT: CritDef[] = [
  // ── Allgemein ─────────────────────────────────────────────
  { key:"hygiene",          short:"Hygiene",       label:"Hygiene LKW / Fahrer i.O.",                         type:"check", note:"entfaellt bei Nachtanlieferung", group:"Allgemein" },
  { key:"etikettierung",    short:"Etikett.",      label:"Etikettierung / Verpackung i.O.",                   type:"check", group:"Allgemein" },
  { key:"qualitaet",        short:"Qualitaet",     label:"Qualitaet / Aussehen i.O.",                         type:"check", group:"Allgemein" },
  { key:"mhd",              short:"MHD",           label:"MHD / Verbrauchsdatum i.O.",                        type:"check", group:"Allgemein" },
  // ── Fleisch ───────────────────────────────────────────────
  { key:"rindfleisch",      short:"Rindfl.",       label:"Rindfleischetikettierung i.O.",                     type:"check", group:"Fleisch" },
  { key:"qs_qs",            short:"QS",            label:"QS - Qualitaet u. Sicherheit i.O.",                 type:"check", group:"Fleisch" },
  { key:"qs_by",            short:"QS-BY",         label:"Geprueft. Qualitaet BY geprueft i.O.",              type:"check", group:"Fleisch" },
  // ── Fisch - Allgemein ─────────────────────────────────────
  { key:"fisch_geruch",     short:"Geruch",        label:"Geruch i.O. (frisch, meeresartig)",                 type:"check", group:"Fisch - Allgemein" },
  { key:"fisch_kiemen",     short:"Kiemen",        label:"Kiemenfarbe i.O. (rot / rosa)",                     type:"check", group:"Fisch - Allgemein" },
  { key:"fisch_augen",      short:"Augen",         label:"Augen i.O. (klar, gewoelbt, glaenzend)",            type:"check", group:"Fisch - Allgemein" },
  { key:"fisch_haut",       short:"Haut",          label:"Haut / Schuppen i.O.",                              type:"check", group:"Fisch - Allgemein" },
  { key:"fisch_konsistenz", short:"Konsist.",      label:"Konsistenz i.O. (Fleisch fest und elastisch)",      type:"check", group:"Fisch - Allgemein" },
  { key:"fisch_herkunft",   short:"Herkunft",      label:"Fangebiet / Herkunft angegeben",                    type:"check", group:"Fisch - Allgemein" },
  // ── MSC-Fisch ─────────────────────────────────────────────
  { key:"fisch_msc_zertifikat", short:"MSC-Zert.", label:"MSC-Zertifikat Lieferant geprueft",                 type:"check", group:"MSC-Fisch" },
  { key:"fisch_msc_kennz",      short:"MSC-Kennz", label:"MSC-Kennzeichnung auf Ware vorhanden",              type:"check", group:"MSC-Fisch" },
  { key:"fisch_msc_coc",        short:"MSC-CoC",   label:"Warenbegleitpapiere (CoC) MSC-konform",             type:"check", group:"MSC-Fisch" },
  { key:"fisch_msc_geliefert",  short:"MSC-Lief.", label:"Gelieferte Ware = bestellte Ware (MSC)",            type:"check", group:"MSC-Fisch" },
  // ── Bio-Ware ──────────────────────────────────────────────
  { key:"bio_zertifikat",   short:"Bio-Zert.",     label:"Bio: Zertifikat Lieferant geprueft",                type:"check", group:"Bio-Ware" },
  { key:"bio_kennz",        short:"Bio-Kennz.",    label:"Bio: Kennzeichnung Ware geprueft",                  type:"check", group:"Bio-Ware" },
  { key:"bio_warenbegleit", short:"Bio-WB",        label:"Bio: Angaben Warenbegleitpapiere",                  type:"check", group:"Bio-Ware" },
  { key:"bio_geliefert",    short:"Bio-Lief.",     label:"Bio: Gelieferte Ware = bestellte Ware",             type:"check", group:"Bio-Ware" },
  // ── Temperatur ────────────────────────────────────────────
  { key:"temp_hackfleisch",    short:"Hackfl.",     label:"Temp. SB-Hackfleisch (max. +2 C)",                 type:"temp", maxVal:2,   group:"Temperatur" },
  { key:"temp_innereien",      short:"Innereien",   label:"Temp. Innereien (max. +3 C)",                      type:"temp", maxVal:3,   group:"Temperatur" },
  { key:"temp_gefluegel",      short:"Gefluegel",   label:"Temp. Gefluegel / Farmwild (max. +4 C)",           type:"temp", maxVal:4,   group:"Temperatur" },
  { key:"temp_fleisch",        short:"Fleisch",     label:"Temp. sonstiges Fleisch (max. +7 C)",              type:"temp", maxVal:7,   group:"Temperatur" },
  { key:"temp_frischfisch",    short:"Frischfisch", label:"Temp. Frischfisch (max. +2 C)",                    type:"temp", maxVal:2,   group:"Temperatur" },
  { key:"temp_fischverarbeit", short:"Fisch-V.",    label:"Temp. verarbeitete Fischerzeugnisse (max. +7 C)",  type:"temp", maxVal:7,   group:"Temperatur" },
  { key:"temp_muscheln",       short:"Muscheln",    label:"Temp. Muscheln lebend (max. +10 C)",               type:"temp", maxVal:10,  group:"Temperatur" },
  { key:"temp_tk",             short:"TK",          label:"Temp. Tiefkuehlware (max. -18 C)",                 type:"temp", maxVal:-18, group:"Temperatur" },
];

const CONFIG: WEBaseConfig = {
  section: "metzgerei",
  pageTitle: "3.1 Wareneingaenge Metzgerei",
  pageSubtitle: "Wareneingangskontrolle Metzgerei - Fleisch, Fisch, MSC",
  allCrit: ALL_CRIT,
  updateEvent: "metzgerei-wareneingaenge-updated",
};

export default function MetzgereiWareneingaenge() {
  return <WareneingaengeBase config={CONFIG} />;
}
