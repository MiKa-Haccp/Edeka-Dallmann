import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import { Smartphone, Trash2, ShieldOff, ShieldCheck, Loader2, RefreshCw, Calendar, AlertTriangle, ChevronLeft } from "lucide-react";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function GeraeteVerwaltung() {
  const { adminSession, deviceToken } = useAppStore();
  const [, navigate] = useLocation();
  const isSuperAdmin = adminSession?.role === "SUPERADMIN";

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/admin/users");
      return;
    }
    loadDevices();
  }, [isSuperAdmin, loadDevices, navigate]);

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

  const activeDevices = devices.filter((d) => d.isActive);
  const revokedDevices = devices.filter((d) => !d.isActive);

  if (!isSuperAdmin) return null;

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6 pb-8">
        <button
          onClick={() => navigate("/admin/system")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Systemverwaltung
        </button>

        <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2d5aa0] rounded-2xl p-5 md:p-7 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-200 font-medium tracking-wide uppercase">Superadmin</p>
                <h1 className="text-xl md:text-2xl font-bold">Geräteverwaltung</h1>
              </div>
            </div>
            <button
              onClick={loadDevices}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-3">
            Hier sehen Sie alle registrierten Geräte und können deren Zugang entziehen.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{activeDevices.length}</div>
              <div className="text-xs text-blue-200">Aktive Geräte</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{revokedDevices.length}</div>
              <div className="text-xs text-blue-200">Gesperrte Geräte</div>
            </div>
          </div>
        </div>

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
      </div>
    </AppLayout>
  );
}
