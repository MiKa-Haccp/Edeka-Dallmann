import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { useLocation, useParams, Link } from "wouter";
import {
  ChevronLeft, Save, Trash2, Printer, Camera, Send, X,
  User, Phone, Mail, MapPin, Clock, Euro, Calendar,
} from "lucide-react";
import { RECRUITING_STAGES, type Applicant } from "./ManagementRecruiting";

const BASE = import.meta.env.VITE_API_URL || "/api";
const ALLOWED_ROLES = ["SUPERADMIN", "ADMIN"];

type Comment = {
  id: number;
  applicantId: number;
  author: string;
  content: string;
  createdAt: string;
};

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const EXP_FIELDS: { key: keyof Applicant; label: string }[] = [
  { key: "experienceKasse",    label: "Kasse" },
  { key: "experienceLaden",    label: "Laden" },
  { key: "experienceObst",     label: "Obst & Gemüse" },
  { key: "experienceMopro",    label: "MoPro / Molkerei" },
  { key: "experienceMetzgerei",label: "Metzgerei / Käsetheke" },
];

// ─── Print-Stylesheet (injected only for printing) ──────────
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #bewerber-print, #bewerber-print * { visibility: visible !important; }
  #bewerber-print { position: fixed; inset: 0; background: white; padding: 20mm; }
  .no-print { display: none !important; }
}
`;

export default function ApplicantDetail() {
  const { adminSession } = useAppStore();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [app, setApp] = useState<Applicant | null>(null);
  const [form, setForm] = useState<Partial<Applicant>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const adminEmail = adminSession?.email || "";
  const authHeaders = { "x-admin-email": adminEmail };

  useEffect(() => {
    if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) {
      navigate("/");
      return;
    }
    loadData();
  }, [adminSession, id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, commRes] = await Promise.all([
        fetch(`${BASE}/management/applicants?tenantId=1`, { headers: authHeaders }),
        fetch(`${BASE}/management/applicants/${id}/comments`, { headers: authHeaders }),
      ]);
      const apps: Applicant[] = await appRes.json();
      const found = apps.find(a => a.id === id);
      const comms: Comment[] = await commRes.json();
      if (found) { setApp(found); setForm(found); }
      setComments(Array.isArray(comms) ? comms : []);
    } catch {
      setApp(null);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof Applicant>(key: K, value: Applicant[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target?.result as string;
      updateField("photoBase64", b64);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/management/applicants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(form),
      });
      const updated = await r.json();
      setApp(updated);
      setForm(updated);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const deleteApplicant = async () => {
    if (!confirm(`Bewerber "${app?.name}" wirklich löschen? Alle Einträge und Notizen werden entfernt.`)) return;
    await fetch(`${BASE}/management/applicants/${id}`, { method: "DELETE", headers: authHeaders });
    navigate("/management/recruiting");
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const authorName = adminSession?.name || "Unbekannt";
    const r = await fetch(`${BASE}/management/applicants/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ author: authorName, content: newComment.trim() }),
    });
    const c = await r.json();
    setComments(prev => [...prev, c]);
    setNewComment("");
  };

  const deleteComment = async (commentId: number) => {
    await fetch(`${BASE}/management/applicants/comments/${commentId}`, { method: "DELETE", headers: authHeaders });
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handlePrint = () => {
    const style = document.createElement("style");
    style.id = "_print_style";
    style.textContent = PRINT_STYLE;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 500);
  };

  if (!adminSession || !ALLOWED_ROLES.includes(adminSession.role)) return null;
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#1a3a6b]/20 border-t-[#1a3a6b] rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }
  if (!app) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-500 mb-4">Bewerber nicht gefunden.</p>
          <Link href="/management/recruiting" className="text-[#1a3a6b] underline">Zurück zur Übersicht</Link>
        </div>
      </AppLayout>
    );
  }

  const currentStage = RECRUITING_STAGES.find(s => s.key === form.status) || RECRUITING_STAGES[0];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 no-print">
          <Link href="/management/recruiting" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[#1a3a6b] truncate">{app.name}</h1>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${currentStage.bg} ${currentStage.color} border ${currentStage.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentStage.dot}`} />
              {currentStage.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="PDF drucken">
              <Printer className="h-5 w-5" />
            </button>
            {dirty && (
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: "#1a3a6b" }}>
                <Save className="w-4 h-4" />
                {saving ? "…" : "Speichern"}
              </button>
            )}
            <button onClick={deleteApplicant} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Bewerber löschen">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable form */}
        <div id="bewerber-print">
          {/* Status selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 no-print">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {RECRUITING_STAGES.map(s => (
                <button
                  key={s.key}
                  onClick={() => updateField("status", s.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    form.status === s.key
                      ? `${s.bg} ${s.color} ${s.border}`
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${form.status === s.key ? s.dot : "bg-gray-300"}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dallmann Bewerber-Checkliste Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            {/* Print header */}
            <div className="hidden print:block mb-4 pb-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-[#1a3a6b]">EDEKA DALLMANN – Bewerber-Checkliste</h1>
              <p className="text-sm text-gray-500 mt-1">Gesprächsunterlage · Vertraulich</p>
            </div>

            <div className="flex items-start gap-4 mb-6">
              {/* Photo */}
              <div className="shrink-0">
                <div
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#2d5aa0] hover:bg-[#eef4fb] transition-colors overflow-hidden"
                  onClick={() => photoRef.current?.click()}
                >
                  {form.photoBase64 ? (
                    <img src={form.photoBase64} className="w-full h-full object-cover" alt="Foto" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">Foto</span>
                    </>
                  )}
                </div>
                <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
              </div>

              {/* Name & Contact */}
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Name *</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 focus:border-[#2d5aa0]"
                    value={form.name || ""}
                    onChange={e => updateField("name", e.target.value)}
                    placeholder="Vor- und Nachname"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Telefon</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 focus:border-[#2d5aa0]"
                      value={form.phone || ""}
                      onChange={e => updateField("phone", e.target.value)}
                      placeholder="0xxx xxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">E-Mail / Indeed</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 focus:border-[#2d5aa0]"
                      value={form.email || ""}
                      onChange={e => updateField("email", e.target.value)}
                      placeholder="Email oder Indeed-Profil"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Erfahrung */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Erfahrung / Kenntnisse</label>
              <div className="flex flex-wrap gap-2">
                {EXP_FIELDS.map(f => {
                  const checked = !!form[f.key];
                  return (
                    <button
                      key={f.key}
                      onClick={() => updateField(f.key as keyof Applicant, (!checked) as Applicant[keyof Applicant])}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                        checked
                          ? "bg-[#1a3a6b] text-white border-[#1a3a6b]"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {checked && <span className="text-white">✓</span>}
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flexibilität / Schicht */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Flexibilität / Schichtmodell</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 resize-none"
                rows={2}
                value={form.flexibility || ""}
                onChange={e => updateField("flexibility", e.target.value)}
                placeholder="z.B. Mo–Sa, gerne früh, kein Samstag Nachmittag, …"
              />
            </div>

            {/* Grid: Stunden, Eintritt, Gehalt, Quelle */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Wunsch-Stunden / Woche</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30"
                  value={form.hoursWish || ""}
                  onChange={e => updateField("hoursWish", e.target.value)}
                  placeholder="z.B. 20–25 Std., Minijob"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gewünschtes Eintrittsdatum</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30"
                  value={form.entryDate || ""}
                  onChange={e => updateField("entryDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gehaltsvorstellung</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30"
                  value={form.salaryWish || ""}
                  onChange={e => updateField("salaryWish", e.target.value)}
                  placeholder="z.B. 14,– €/Std."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bewerbungsquelle</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30"
                  value={form.source || ""}
                  onChange={e => updateField("source", e.target.value)}
                  placeholder="Indeed, Walk-in, Empfehlung …"
                />
              </div>
            </div>

            {/* Notizen */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gesprächsnotizen / Allgemeines</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 resize-none"
                rows={4}
                value={form.notes || ""}
                onChange={e => updateField("notes", e.target.value)}
                placeholder="Persönlicher Eindruck, Gesprächsverlauf, Stärken, Besonderheiten …"
              />
            </div>

            {/* Print footer */}
            <div className="hidden print:flex mt-6 pt-4 border-t border-gray-200 justify-between text-xs text-gray-400">
              <span>Gespräch geführt von: _________________________</span>
              <span>Datum: _________________</span>
            </div>
          </div>
        </div>

        {/* Verlauf (Comments) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 no-print">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1a3a6b]" />
            Verlauf / Kommunikations-Log
          </h2>

          <div className="space-y-3 mb-4">
            {comments.length === 0 && (
              <p className="text-xs text-gray-400 italic">Noch keine Einträge. Halte hier fest, was besprochen wurde.</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="bg-[#eef4fb] rounded-xl p-3 group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#1a3a6b]">{c.author}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <textarea
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5aa0]/30 resize-none"
              rows={2}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) addComment(); }}
              placeholder="Neuen Verlaufs-Eintrag schreiben… (Strg+Enter zum Senden)"
            />
            <button
              onClick={addComment}
              disabled={!newComment.trim()}
              className="px-3 py-2 rounded-xl text-white disabled:opacity-50 self-end transition-colors hover:opacity-90"
              style={{ background: "#1a3a6b" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save button (floating) */}
        {dirty && (
          <div className="fixed bottom-6 right-6 no-print">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white shadow-lg font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "#1a3a6b" }}
            >
              <Save className="w-5 h-5" />
              {saving ? "Speichern…" : "Änderungen speichern"}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
