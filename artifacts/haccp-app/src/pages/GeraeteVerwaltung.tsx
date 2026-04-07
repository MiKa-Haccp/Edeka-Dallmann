import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAppStore } from "@/store/use-app-store";
import {
  Smartphone, Trash2, ShieldOff, ShieldCheck, Loader2, RefreshCw, Calendar,
  AlertTriangle, ChevronLeft, Link2, Plus, Copy, Mail, CheckCircle2, Clock, X,
} from "lucide-react";
import { useLocation } from "wouter";

const BASE = import.meta.env.VITE_API_URL || "/api";

interface Device {
  id: number;
  name: string;
  token: string;
  isActive: boolean;
  createdAt: string;
  revokedAt: string | null;
  tenantId: number;
}

interface RegLink {
  id: number;
  key: string;
  tenant_id: number;
  device_name_hint: string | null;
  email: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  device_id: number | null;
  device_name: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function GeraeteVerwaltung() {
  const { adminSession, deviceToken } = useAppStore();
  const [, navigate] = useLocation();
  const isSuperAdmin = adminSession?.role === "SUPERADMIN";

  // Geräte
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Registrierungslinks
  const [regLinks, setRegLinks] = useState<RegLink[]>([]);
  const [regLinksLoading, setRegLinksLoading] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkDeviceName, setLinkDeviceName] = useState("");
  const [linkEmail, setLinkEmail] = useState("");
  const [linkExpiryDays, setLinkExpiryDays] = useState(30);
  const [creatingLink, setCreatingLink] = useState(false);
  const [createdLink, setCreatedLink] = useState<{ regUrl: string; emailSent: boolean } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deletingLink, setDeletingLink] = useState<number | null>(null);

  // Tab
  const [tab, setTab] = useState<"devices" | "links">("devices");

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/devices`);
      const data = await res.json();
      setDevices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRegLinks = useCallback(async () => {
    setRegLinksLoading(true);
    try {
      const res = await fetch(`${BASE}/device/reg-links`);
      const data = await res.json();
      setRegLinks(data);
    } finally {
      setRegLinksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/admin/users");
      return;
    }
    loadDevices();
    loadRegLinks();
  }, [isSuperAdmin, loadDevices, loadRegLinks, navigate]);

  const handleRevoke = async (id: number) => {
    setRevoking(id);
    try {
      await fetch(`${BASE}/devices/${id}`, { method: "DELETE" });
      await loadDevices();
    } finally {
      setRevoking(null);
      setConfirmRevoke(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await fetch(`${BASE}/devices/${id}/permanent`, { method: "DELETE" });
      await loadDevices();
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLink(true);
    setCreatedLink(null);
    try {
      const appBaseUrl = window.location.origin + (import.meta.env.BASE_URL !== "/" ? import.meta.env.BASE_URL.replace(/\/$/, "") : "");
      const res = await fetch(`${BASE}/device/create-reg-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: 1,
          deviceNameHint: linkDeviceName.trim() || undefined,
          email: linkEmail.trim() || undefined,
          appBaseUrl,
          expiryDays: linkExpiryDays,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedLink({ regUrl: data.regUrl, emailSent: data.emailSent });
        setLinkDeviceName("");
        setLinkEmail("");
        await loadRegLinks();
      }
    } finally {
      setCreatingLink(false);
    }
  };

  const handleDeleteLink = async (id: number) => {
    setDeletingLink(id);
    try {
      await fetch(`${BASE}/device/reg-links/${id}`, { method: "DELETE" });
      await loadRegLinks();
    } finally {
      setDeletingLink(null);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback for Android/older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const activeDevices = devices.filter((d) => d.isActive);
  const revokedDevices = devices.filter((d) => !d.isActive);
  const activeLinks = regLinks.filter((l) => !l.used_at && new Date() < new Date(l.expires_at));
  const usedLinks = regLinks.filter((l) => l.used_at || new Date() >= new Date(l.expires_at));

  if (!isSuperAdmin) return null;

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-5 pb-8">
        <button
          onClick={() => navigate("/admin/system")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Systemverwaltung
        </button>

        <PageHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-200 font-medium tracking-wide uppercase">Superadmin</p>
                <h1 className="text-xl md:text-2xl font-bold text-white">Geräteverwaltung</h1>
              </div>
            </div>
            <button
              onClick={() => { loadDevices(); loadRegLinks(); }}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              title="Aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            Geräte verwalten und Registrierungslinks per E-Mail versenden.
          </p>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{activeDevices.length}</div>
              <div className="text-xs text-blue-200">Aktive Geräte</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{revokedDevices.length}</div>
              <div className="text-xs text-blue-200">Gesperrt</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{activeLinks.length}</div>
              <div className="text-xs text-blue-200">Offene Links</div>
            </div>
          </div>
        </PageHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/30 rounded-2xl border border-border/20">
          <button
            onClick={() => setTab("devices")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "devices" ? "bg-white shadow-sm text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Smartphone className="w-4 h-4" />
            Geräte ({activeDevices.length})
          </button>
          <button
            onClick={() => setTab("links")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "links" ? "bg-white shadow-sm text-[#1a3a6b]" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Link2 className="w-4 h-4" />
            Reg.-Links {activeLinks.length > 0 && <span className="bg-[#1a3a6b] text-white text-xs px-1.5 py-0.5 rounded-full">{activeLinks.length}</span>}
          </button>
        </div>

        {/* ===== TAB: GERÄTE ===== */}
        {tab === "devices" && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Lade Geräte...
              </div>
            )}

            {!loading && activeDevices.length > 0 && (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                <div className="bg-green-50 border-b border-border/60 px-5 py-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <h2 className="font-semibold text-sm text-green-800">Aktive Geräte ({activeDevices.length})</h2>
                </div>
                <div className="divide-y divide-border/40">
                  {activeDevices.map((device) => {
                    const isCurrentDevice = device.token === deviceToken;
                    return (
                      <div key={device.id} className="px-5 py-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCurrentDevice ? "bg-blue-100" : "bg-green-50"}`}>
                          <Smartphone className={`w-5 h-5 ${isCurrentDevice ? "text-blue-600" : "text-green-600"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground truncate">{device.name}</p>
                            {isCurrentDevice && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                Dieses Gerät
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Registriert: {formatDate(device.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {confirmRevoke === device.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-600 font-medium">Sicher?</span>
                              <button
                                onClick={() => handleRevoke(device.id)}
                                disabled={revoking === device.id}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {revoking === device.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ja, sperren"}
                              </button>
                              <button
                                onClick={() => setConfirmRevoke(null)}
                                className="px-3 py-1.5 border border-border text-xs font-medium rounded-lg hover:bg-secondary transition-colors"
                              >
                                Abbrechen
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRevoke(device.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
                            >
                              <ShieldOff className="w-3.5 h-3.5" />
                              Sperren
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && activeDevices.length === 0 && (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 text-center">
                <Smartphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Noch keine Geräte registriert.</p>
                <button onClick={() => setTab("links")} className="mt-3 text-sm text-[#1a3a6b] font-medium hover:underline">
                  Registrierungslink erstellen →
                </button>
              </div>
            )}

            {!loading && revokedDevices.length > 0 && (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                <div className="bg-red-50 border-b border-border/60 px-5 py-3 flex items-center gap-2">
                  <ShieldOff className="w-4 h-4 text-red-600" />
                  <h2 className="font-semibold text-sm text-red-800">Gesperrte Geräte ({revokedDevices.length})</h2>
                </div>
                <div className="divide-y divide-border/40">
                  {revokedDevices.map((device) => (
                    <div key={device.id} className="px-5 py-4 flex items-center gap-4 opacity-60">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate line-through">{device.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Reg.: {formatDate(device.createdAt)}</p>
                          </div>
                          {device.revokedAt && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <p className="text-xs text-red-500">Gesperrt: {formatDate(device.revokedAt)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {confirmDelete === device.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-600 font-medium">Löschen?</span>
                            <button
                              onClick={() => handleDelete(device.id)}
                              disabled={deleting === device.id}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {deleting === device.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ja"}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1.5 border border-border text-xs font-medium rounded-lg hover:bg-secondary transition-colors"
                            >
                              Nein
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(device.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:bg-secondary text-xs font-medium rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Entfernen
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== TAB: REGISTRIERUNGSLINKS ===== */}
        {tab === "links" && (
          <div className="space-y-4">
            {/* Info-Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">Wie funktionieren Registrierungslinks?</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Erstellen Sie einen Link und senden Sie ihn per E-Mail oder kopieren Sie ihn manuell.
                Wenn das Gerät (iPad, Android-Tablet, …) den Link öffnet, wird es <strong>dauerhaft und automatisch</strong> registriert –
                ohne Master-Passwort. Nach einem Server-Update bleibt der Token in der Datenbank gültig.
              </p>
            </div>

            {/* Link erstellen */}
            {!showLinkForm && !createdLink && (
              <button
                onClick={() => setShowLinkForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1a3a6b] text-white rounded-2xl font-bold hover:bg-[#2d5aa0] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Neuen Registrierungslink erstellen
              </button>
            )}

            {showLinkForm && !createdLink && (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-foreground">Registrierungslink erstellen</h3>
                  <button onClick={() => setShowLinkForm(false)} className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateLink} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Gerätename (Vorschlag, optional)</label>
                    <input
                      type="text"
                      value={linkDeviceName}
                      onChange={(e) => setLinkDeviceName(e.target.value)}
                      placeholder="z.B. iPad Metzgerei Leeder, Tablet Büro MOD"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Wird als Vorschlag beim Gerät angezeigt, kann aber geändert werden</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> E-Mail-Adresse (optional)
                    </label>
                    <input
                      type="email"
                      value={linkEmail}
                      onChange={(e) => setLinkEmail(e.target.value)}
                      placeholder="z.B. markt-leeder@edeka-dallmann.de"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Falls angegeben, wird der Link automatisch per E-Mail versendet</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Gültigkeitsdauer
                    </label>
                    <select
                      value={linkExpiryDays}
                      onChange={(e) => setLinkExpiryDays(Number(e.target.value))}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 bg-white"
                    >
                      <option value={7}>7 Tage</option>
                      <option value={30}>30 Tage</option>
                      <option value={90}>90 Tage</option>
                      <option value={365}>1 Jahr</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingLink}
                    className="w-full py-3 bg-[#1a3a6b] text-white rounded-xl font-bold text-sm hover:bg-[#2d5aa0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creatingLink ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        {linkEmail.trim() ? "Link erstellen & E-Mail senden" : "Link erstellen"}
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Erstellter Link – Bestätigung */}
            {createdLink && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-green-800">Link erstellt!</p>
                    {createdLink.emailSent && (
                      <p className="text-xs text-green-700">E-Mail wurde erfolgreich versendet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-green-200 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">Registrierungslink (einmalig, auf Gerät öffnen):</p>
                  <p className="text-xs font-mono text-foreground break-all leading-relaxed">{createdLink.regUrl}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(createdLink.regUrl, "new")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-green-300 text-green-800 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors"
                  >
                    {copiedKey === "new" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedKey === "new" ? "Kopiert!" : "Link kopieren"}
                  </button>
                  <button
                    onClick={() => { setCreatedLink(null); setShowLinkForm(false); }}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    Fertig
                  </button>
                </div>
              </div>
            )}

            {/* Aktive Links */}
            {regLinksLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {activeLinks.length > 0 && (
                  <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                    <div className="bg-blue-50 border-b border-border/60 px-5 py-3 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-blue-600" />
                      <h2 className="font-semibold text-sm text-blue-800">Offene Links ({activeLinks.length})</h2>
                    </div>
                    <div className="divide-y divide-border/40">
                      {activeLinks.map((link) => {
                        const regUrl = `${window.location.origin}${import.meta.env.BASE_URL !== "/" ? import.meta.env.BASE_URL.replace(/\/$/, "") : ""}/?reg_key=${link.key}`;
                        return (
                          <div key={link.id} className="px-5 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground">
                                  {link.device_name_hint || <span className="text-muted-foreground italic">Kein Name vorgegeben</span>}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                  {link.email && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Mail className="w-3 h-3" />{link.email}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />Gültig bis {formatDateShort(link.expires_at)}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />Erstellt {formatDateShort(link.created_at)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => copyToClipboard(regUrl, link.key)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1a3a6b]/30 text-[#1a3a6b] hover:bg-[#1a3a6b]/5 text-xs font-semibold rounded-lg transition-colors"
                                  title="Link kopieren"
                                >
                                  {copiedKey === link.key ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedKey === link.key ? "Kopiert" : "Kopieren"}
                                </button>
                                <button
                                  onClick={() => handleDeleteLink(link.id)}
                                  disabled={deletingLink === link.id}
                                  className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Link löschen"
                                >
                                  {deletingLink === link.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Verwendete/abgelaufene Links */}
                {usedLinks.length > 0 && (
                  <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                    <div className="bg-muted/40 border-b border-border/60 px-5 py-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                      <h2 className="font-semibold text-sm text-muted-foreground">Verwendet / Abgelaufen ({usedLinks.length})</h2>
                    </div>
                    <div className="divide-y divide-border/40">
                      {usedLinks.map((link) => (
                        <div key={link.id} className="px-5 py-3 flex items-center gap-3 opacity-60">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {link.device_name_hint || "–"}
                              {link.device_name && <span className="text-xs text-muted-foreground ml-2">→ {link.device_name}</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {link.used_at ? `Verwendet ${formatDateShort(link.used_at)}` : `Abgelaufen ${formatDateShort(link.expires_at)}`}
                              {link.email && ` · ${link.email}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            disabled={deletingLink === link.id}
                            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          >
                            {deletingLink === link.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {regLinks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Noch keine Registrierungslinks erstellt.
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
