import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const probeentnahmeTable = pgTable("probeentnahme", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),

  // Marktdaten
  markt: text("markt"),
  ansprechpartner: text("ansprechpartner"),

  // Behörde
  behoerdeBezeichnung: text("behoerde_bezeichnung"),

  // Probendaten (3.22-1)
  grundProbenahme: text("grund_probenahme"),
  untersuchungsziel: text("untersuchungsziel"),
  datumEntnahme: text("datum_entnahme"),

  // Gegenprobe / Zweitprobe
  gegenprobeArt: text("gegenprobe_art"), // "gegenprobe" | "zweitprobe" | ""
  gegenprobeStatus: text("gegenprobe_status"), // "hinterlassen" | "nicht_vorhanden"

  // Warenart
  probentyp: text("probentyp"), // "fertigpackung" | "lose_ware" | "bedientheke"

  // Produktdaten
  ean: text("ean"),
  artikelNr: text("artikel_nr"),
  verkehrsbezeichnung: text("verkehrsbezeichnung"),
  mhd: text("mhd"),
  losnummer: text("losnummer"),
  fuellmenge: text("fuellmenge"),
  hersteller: text("hersteller"),

  // Weiterleitung
  durchschriftGefaxtDurch: text("durchschrift_gefaxt_durch"),
  durchschriftGefaxtAm: text("durchschrift_gefaxt_am"),

  // 3.22-2 Probenübergabeprotokoll
  abholerName: text("abholer_name"),
  abholerFirmaName: text("abholer_firma_name"),
  abholerFirmaStrasse: text("abholer_firma_strasse"),
  abholerFirmaPostfach: text("abholer_firma_postfach"),
  abholerFirmaPlzOrt: text("abholer_firma_plz_ort"),
  amtlicheProbennummer: text("amtliche_probennummer"),
  siegeldatum: text("siegeldatum"),
  uebergabeArtikel: text("uebergabe_artikel"),
  uebergabeOrtDatum: text("uebergabe_ort_datum"),
  gegenprobeAbgeholtAm: text("gegenprobe_abgeholt_am"),
  gegenprobeAbgeholtDurch: text("gegenprobe_abgeholt_durch"),

  // Digitale Unterschriften (UnterschriftPad)
  unterschriftAbholerDigital: text("unterschrift_abholer_digital"),
  unterschriftMitarbeiterDigital: text("unterschrift_mitarbeiter_digital"),

  // Foto des amtlichen Dokuments (Durchschlag der Behörde)
  amtlichesDokumentFoto: text("amtliches_dokument_foto"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Probeentnahme = typeof probeentnahmeTable.$inferSelect;
export type NewProbeentnahme = typeof probeentnahmeTable.$inferInsert;
