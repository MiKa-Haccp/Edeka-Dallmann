import { useEffect } from "react";
import ReactDOM from "react-dom";

type JaNein = true | false | null;

interface FormData {
  markt: string;
  ansprechpartner: string;
  email: string;
  telefon: string;
  telefax: string;
  erkennungDurch: "markt" | "verbraucher" | "";
  einwilligungVorhanden: JaNein;
  markenname: string;
  einzelEan: string;
  mhd: string;
  losnummer: string;
  lieferantencode: string;
  belieferungsart: "strecke" | "grosshandel" | "";
  grosshandelsstandort: string;
  fehlerbeschreibung: string;
  mengeverbraucher: string;
  mengemarkt: string;
  kaufdatum: string;
  kassenbonVorhanden: JaNein;
  kundeEntschaedigt: JaNein;
  produktVorhanden: JaNein;
  fremdkoerperVorhanden: JaNein;
  gleichesMhdImMarkt: JaNein;
  gleicherFehlerImBestand: JaNein;
  wareAusRegalGenommen: JaNein;
  datumUnterschrift: string;
  unterschriftMarktleiter: string;
  unterschriftPersonalDigital: string;
  unterschriftKundeDigital: string;
  verbraucherName: string;
  verbraucherAdresse: string;
  verbraucherTelefon: string;
  verbraucherEmail: string;
  einwilligungUnterschriftOrt: string;
  einwilligungDatum: string;
}

const GROSSHANDEL_STANDORTE = [
  "Gaimersheim", "Landsberg am Lech", "Straubing", "Trostberg", "Eching",
];

function jnInline(v: JaNein, label: string) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
      <span style={{ flex: 1, fontSize: 10 }}>{label}</span>
      <span style={{ fontSize: 10, whiteSpace: "nowrap" }}>
        <span style={{ marginRight: 12 }}>{v === true ? "☑" : "☐"} Ja</span>
        <span>{v === false ? "☑" : "☐"} Nein</span>
      </span>
    </div>
  );
}

function Field({ label, value, width = "100%" }: { label: string; value?: string; width?: string }) {
  return (
    <div style={{ width, display: "inline-block", verticalAlign: "top", marginBottom: 6, paddingRight: 8, boxSizing: "border-box" }}>
      <div style={{ fontSize: 8, color: "#666", marginBottom: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ borderBottom: "1px solid #333", minHeight: 18, fontSize: 10, padding: "1px 2px", wordBreak: "break-word" }}>
        {value || "\u00A0"}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: "bold", fontSize: 10, marginTop: 10, marginBottom: 4, borderBottom: "1px solid #999", paddingBottom: 2 }}>
      {children}
    </div>
  );
}

function PrintDocument({ form }: { form: FormData }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#000", padding: "0 4mm", fontSize: 10 }}>

      {/* ===== SEITE 1 ===== */}
      <div style={{ pageBreakAfter: "always" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6 }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "top" }}>
                <div style={{ fontSize: 13, fontWeight: "bold" }}>3.14 Produktfehlermeldung</div>
                <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>
                  Bitte alle Felder ausfüllen; falls keine Informationen vorliegen, einen Strich machen!
                </div>
              </td>
              <td style={{ textAlign: "right", fontSize: 9, verticalAlign: "top", color: "#666" }}>
                (Seite 1 von 2)
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "70%", verticalAlign: "top" }}>
                <Field label="Markt" value={form.markt} width="100%" />
                <Field label="Ansprechpartner" value={form.ansprechpartner} width="100%" />
                <Field label="E-Mail Adresse" value={form.email} width="100%" />
                <Field label="Telefon" value={form.telefon} width="100%" />
                <Field label="Telefax" value={form.telefax} width="100%" />
              </td>
              <td style={{ width: "30%", verticalAlign: "top", paddingLeft: 12 }}>
                <div style={{ border: "1px solid #333", height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, color: "#999" }}>Marktstempel</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <SectionTitle>Erkennung des Fehlers durch:</SectionTitle>
        <div style={{ paddingLeft: 8 }}>
          <div style={{ fontSize: 10, marginBottom: 3 }}>
            {form.erkennungDurch === "markt" ? "☑" : "☐"} den Markt
          </div>
          <div style={{ fontSize: 10, marginBottom: 3 }}>
            {form.erkennungDurch === "verbraucher" ? "☑" : "☐"} den Verbraucher
            {form.erkennungDurch === "verbraucher" && (
              <span style={{ marginLeft: 12, fontSize: 9, color: "#444" }}>
                {form.einwilligungVorhanden
                  ? "☑ Verbraucherdaten und Einwilligungserklärung liegen vor (siehe S. 2)"
                  : "☐ Verbraucherdaten/Einwilligungserklärung liegen nicht vor"}
              </span>
            )}
          </div>
        </div>

        <SectionTitle>Produktdaten</SectionTitle>
        <Field label="Markenname / Artikel-Bezeichnung / Füllmenge" value={form.markenname} width="65%" />
        <Field label="Einzel-EAN / PLU" value={form.einzelEan} width="35%" />
        <Field label="MHD / Verbrauchsdatum" value={form.mhd} width="33%" />
        <Field label="Losnummer / Chargennummer" value={form.losnummer} width="33%" />
        <Field label="Lieferantencode (bei Eigenmarken)" value={form.lieferantencode} width="33%" />

        <SectionTitle>Art der Belieferung:</SectionTitle>
        <div style={{ paddingLeft: 8, fontSize: 10 }}>
          <div style={{ marginBottom: 3 }}>
            {form.belieferungsart === "strecke" ? "☑" : "☐"} Strecke
          </div>
          <div>
            {form.belieferungsart === "grosshandel" ? "☑" : "☐"} Großhandel aus Lager: &nbsp;
            {GROSSHANDEL_STANDORTE.map((s) => (
              <span key={s} style={{ marginRight: 10 }}>
                {form.grosshandelsstandort === s ? "☑" : "☐"} {s}
              </span>
            ))}
          </div>
        </div>

        <SectionTitle>Fehlerbeschreibung mit Beanstandungsgrund, ggf. gesundheitliche Beeinträchtigung:</SectionTitle>
        <div style={{ border: "1px solid #ccc", minHeight: 50, padding: 4, fontSize: 10, wordBreak: "break-word" }}>
          {form.fehlerbeschreibung || "\u00A0"}
        </div>

        <SectionTitle>Betroffene Menge &amp; Kaufdaten</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", verticalAlign: "top", paddingRight: 8 }}>
                <Field label="Betroffene Menge – Verbraucher" value={form.mengeverbraucher} width="100%" />
                <Field label="Betroffene Menge – Markt (insg.)" value={form.mengemarkt} width="100%" />
                <Field label="Kaufdatum" value={form.kaufdatum} width="100%" />
              </td>
              <td style={{ width: "50%", verticalAlign: "top", paddingLeft: 8 }}>
                {jnInline(form.kassenbonVorhanden, "Kaufbeleg (Kassen-Bon) vorhanden:")}
                {jnInline(form.kundeEntschaedigt, "Kunde wurde bereits entschädigt:")}
              </td>
            </tr>
          </tbody>
        </table>

        <SectionTitle>Checkliste</SectionTitle>
        <div style={{ paddingLeft: 4 }}>
          {jnInline(form.produktVorhanden, "Liegt das reklamierte Produkt vor?")}
          {jnInline(form.fremdkoerperVorhanden, "Bei Fremdkörper-Reklamation: Liegt Fremdkörper vor?")}
          {jnInline(form.gleichesMhdImMarkt, "Liegt das Produkt mit gleichem MHD im Markt noch vor?")}
          {form.gleichesMhdImMarkt === true && (
            <div style={{ paddingLeft: 16 }}>
              {jnInline(form.gleicherFehlerImBestand, "Wenn ja, weist dieser Bestand den gleichen Fehler auf?")}
              {jnInline(form.wareAusRegalGenommen, "Wurde die Ware aus dem Regal genommen?")}
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <Field label="Datum" value={form.datumUnterschrift} width="40%" />
          {form.unterschriftPersonalDigital ? (
            <div style={{ width: "60%", display: "inline-block", verticalAlign: "top", paddingRight: 8, boxSizing: "border-box" }}>
              <div style={{ fontSize: 8, color: "#666", marginBottom: 1, textTransform: "uppercase" }}>Unterschrift Marktleiter / Vertreter</div>
              <img src={form.unterschriftPersonalDigital} alt="Unterschrift Personal" style={{ height: 48, maxWidth: "100%", border: "1px solid #ccc", borderRadius: 4 }} />
            </div>
          ) : (
            <Field label="Unterschrift Marktleiter / Vertreter" value={"                                                        "} width="60%" />
          )}
        </div>

        <div style={{ marginTop: 14, border: "1px solid #ccc", padding: 6, fontSize: 9, textAlign: "center" }}>
          <strong>Protokoll und alle vorhandenen Daten/Unterlagen bzw. Fotos bitte umgehend weiterleiten an:</strong><br />
          Fax-Nr.: 08458/62-510 &nbsp;|&nbsp; qm.suedbayern@edeka.de<br />
          <strong>Das ausgefüllte Formblatt muss für 3 Jahre von der Marktleitung archiviert werden.</strong>
        </div>
        <div style={{ marginTop: 4, fontSize: 8, color: "#999", display: "flex", justifyContent: "space-between" }}>
          <span>3.14</span>
          <span>Qualitätssicherungs-Handbuch Einzelhandel – Südbayern</span>
          <span>07/2018</span>
        </div>
      </div>

      {/* ===== SEITE 2 ===== */}
      <div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6 }}>
          <tbody>
            <tr>
              <td><div style={{ fontSize: 13, fontWeight: "bold" }}>3.14 Produktfehlermeldung</div></td>
              <td style={{ textAlign: "right", fontSize: 9, color: "#666" }}>(Seite 2 von 2)</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: 10, color: "#333", marginBottom: 8, lineHeight: 1.5 }}>
          <p style={{ marginBottom: 4 }}>Die Angabe Ihrer Daten ist freiwillig.</p>
          <p>
            Die von Ihnen angegebenen Daten werden zur Bearbeitung Ihrer Reklamation gespeichert und an den
            EDEKA-Verbund weitergegeben. Weiterhin werden die Daten auch an den Lieferanten und/oder Hersteller
            des reklamierten Produkts übermittelt.
          </p>
        </div>

        <SectionTitle>Verbraucherdaten:</SectionTitle>
        <Field label="Name" value={form.verbraucherName} width="55%" />
        <Field label="Telefon" value={form.verbraucherTelefon} width="45%" />
        <Field label="Adresse" value={form.verbraucherAdresse} width="55%" />
        <Field label="E-Mail" value={form.verbraucherEmail} width="45%" />

        <SectionTitle>Einwilligungserklärung Datenschutz:</SectionTitle>
        <div style={{ fontSize: 10, color: "#333", marginBottom: 8, lineHeight: 1.5, border: "1px solid #eee", padding: 6 }}>
          Mit meiner Unterschrift willige ich ein, dass meine im Meldebogen angegebenen personenbezogenen Daten zur
          Bearbeitung und Abwicklung meines Anliegens durch die o.g. Unternehmen verarbeitet werden. Diese können
          mit mir hierzu per Telefon oder E-Mail Kontakt aufnehmen. Die Daten werden vertraulich behandelt.
          Mir ist bewusst, dass diese Einwilligung freiwillig und jederzeit widerrufbar ist.
        </div>

        <div style={{ marginTop: 20 }}>
          <Field label="Ort, Datum" value={form.einwilligungUnterschriftOrt || "                                    "} width="48%" />
          {form.unterschriftKundeDigital ? (
            <div style={{ width: "48%", display: "inline-block", verticalAlign: "top", boxSizing: "border-box" }}>
              <div style={{ fontSize: 8, color: "#666", marginBottom: 1, textTransform: "uppercase" }}>Unterschrift des Kunden</div>
              <img src={form.unterschriftKundeDigital} alt="Unterschrift Kunde" style={{ height: 48, maxWidth: "100%", border: "1px solid #ccc", borderRadius: 4 }} />
            </div>
          ) : (
            <Field label="Unterschrift des Kunden" value={"                                    "} width="48%" />
          )}
        </div>

        <div style={{ marginTop: 20, border: "1px solid #ccc", padding: 6, fontSize: 9, textAlign: "center" }}>
          <strong>Protokoll und alle vorhandenen Daten/Unterlagen bzw. Fotos bitte umgehend weiterleiten an:</strong><br />
          Fax-Nr.: 08458/62-510 &nbsp;|&nbsp; qm.suedbayern@edeka.de<br />
          <strong>Das ausgefüllte Formblatt muss für 3 Jahre von der Marktleitung archiviert werden.</strong>
        </div>
        <div style={{ marginTop: 4, fontSize: 8, color: "#999", display: "flex", justifyContent: "space-between" }}>
          <span>3.14</span>
          <span>Qualitätssicherungs-Handbuch Einzelhandel – Südbayern</span>
          <span>07/2018</span>
        </div>
      </div>

    </div>
  );
}

interface Props {
  form: FormData;
  onClose: () => void;
}

export function DruckformularPFM({ form, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    // Inject print styles into <head>
    const style = document.createElement("style");
    style.id = "pfm-print-style";
    style.textContent = `
      @media print {
        body > *:not(#pfm-print-root) { display: none !important; }
        #pfm-print-root { display: block !important; position: static !important; }
        @page { margin: 10mm; size: A4 portrait; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.overflow = "";
      document.getElementById("pfm-print-style")?.remove();
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // The print document rendered as a portal directly into document.body
  const printPortal = ReactDOM.createPortal(
    <div
      id="pfm-print-root"
      style={{ display: "none", position: "absolute", top: 0, left: 0, width: "100%", background: "#fff" }}
    >
      <PrintDocument form={form} />
    </div>,
    document.body
  );

  return (
    <>
      {/* Modal overlay (screen only) */}
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a3a6b]/10 rounded-xl flex items-center justify-center text-lg">
              🖨️
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Formular drucken</h2>
              <p className="text-xs text-muted-foreground">
                Das EDEKA-Formblatt 3.14 wird vorausgefüllt auf 2 Seiten gedruckt.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
            <p className="font-bold">So geht es weiter nach dem Druck:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Marktleiter und ggf. Kunde unterschreiben das gedruckte Formular</li>
              <li>Nur die Unterschriftsseite fotografieren und im System hochladen</li>
              <li>Formular per Fax oder E-Mail an EDEKA QM weiterleiten</li>
            </ol>
            <div className="mt-2 pt-2 border-t border-amber-300 font-medium">
              📠 Fax: 08458/62-510 &nbsp;·&nbsp; ✉️ qm.suedbayern@edeka.de
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border/60 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2.5 bg-[#1a3a6b] text-white rounded-xl text-sm font-bold hover:bg-[#2d5aa0] transition-colors"
            >
              🖨️ Jetzt drucken
            </button>
          </div>
        </div>
      </div>

      {/* Print document portal — mounted directly on document.body */}
      {printPortal}
    </>
  );
}
