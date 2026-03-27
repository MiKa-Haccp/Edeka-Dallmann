import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const produktfehlermeldungTable = pgTable("produktfehlermeldung", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  marketId: integer("market_id"),

  // Marktdaten
  markt: text("markt"),
  ansprechpartner: text("ansprechpartner"),
  email: text("email"),
  telefon: text("telefon"),
  telefax: text("telefax"),

  // Erkennungsweg
  erkennungDurch: text("erkennung_durch"), // "markt" | "verbraucher"
  einwilligungVorhanden: boolean("einwilligung_vorhanden"),

  // Produktdaten
  markenname: text("markenname"),
  einzelEan: text("einzel_ean"),
  mhd: text("mhd"),
  losnummer: text("losnummer"),
  lieferantencode: text("lieferantencode"),

  // Belieferungsart
  belieferungsart: text("belieferungsart"), // "strecke" | "grosshandel"
  grosshandelsstandort: text("grosshandelsstandort"),

  // Fehlerbeschreibung
  fehlerbeschreibung: text("fehlerbeschreibung"),

  // Mengen & Kaufdaten
  mengeverbraucher: text("menge_verbraucher"),
  mengemarkt: text("menge_markt"),
  kaufdatum: text("kaufdatum"),
  kassenbonVorhanden: boolean("kassenbon_vorhanden"),
  kundeEntschaedigt: boolean("kunde_entschaedigt"),

  // Checkliste Ja/Nein
  produktVorhanden: boolean("produkt_vorhanden"),
  fremdkoerperVorhanden: boolean("fremdkoerper_vorhanden"),
  gleichesMhdImMarkt: boolean("gleiches_mhd_im_markt"),
  gleicherFehlerImBestand: boolean("gleicher_fehler_im_bestand"),
  wareAusRegalGenommen: boolean("ware_aus_regal_genommen"),

  // Abschluss
  datumUnterschrift: text("datum_unterschrift"),
  unterschriftMarktleiter: text("unterschrift_marktleiter"),

  // Foto der Unterschriften (base64) — Kamera-Upload
  unterschriftFoto: text("unterschrift_foto"),

  // Digitale Unterschriften (base64 PNG) — Stift / Touch auf Tablet
  unterschriftPersonalDigital: text("unterschrift_personal_digital"),
  unterschriftKundeDigital: text("unterschrift_kunde_digital"),

  // Verbraucherdaten (Seite 2)
  verbraucherName: text("verbraucher_name"),
  verbraucherAdresse: text("verbraucher_adresse"),
  verbraucherTelefon: text("verbraucher_telefon"),
  verbraucherEmail: text("verbraucher_email"),
  einwilligungUnterschriftOrt: text("einwilligung_unterschrift_ort"),
  einwilligungDatum: text("einwilligung_datum"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Produktfehlermeldung = typeof produktfehlermeldungTable.$inferSelect;
export type NewProduktfehlermeldung = typeof produktfehlermeldungTable.$inferInsert;
