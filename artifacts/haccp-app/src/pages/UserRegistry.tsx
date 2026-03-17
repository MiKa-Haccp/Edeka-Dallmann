import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/use-app-store";
import {
  useListUsers,
  useRegisterUser,
  useSuggestInitials,
  useResetUserCredentials,
} from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import {
  UserPlus,
  Users,
  KeyRound,
  RefreshCcw,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return twMerge(clsx(inputs));
}

export default function UserRegistry() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <RegistrationForm />
        <UserList />
      </div>
    </AppLayout>
  );
}

function RegistrationForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const registerUser = useRegisterUser();
  const suggestInitials = useSuggestInitials();
  const { data: users, refetch } = useListUsers({ tenantId: 1 });

  useEffect(() => {
    if (firstName.length >= 2 && lastName.length >= 2) {
      suggestInitials.mutate(
        { data: { firstName, lastName, tenantId: 1 } },
        {
          onSuccess: (data) => {
            const allSuggestions = [data.suggestion, ...data.alternatives];
            setSuggestions(allSuggestions);
            if (!initials) {
              setInitials(data.suggestion);
            }
          },
        }
      );
    }
  }, [firstName, lastName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!firstName || !lastName || !birthDate) {
      setError("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    if (!initials || initials.length < 2 || initials.length > 3) {
      setError("Kürzel muss 2-3 Buchstaben lang sein.");
      return;
    }

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN muss genau 4 Ziffern enthalten.");
      return;
    }

    if (pin !== pinConfirm) {
      setError("PIN-Bestätigung stimmt nicht überein.");
      return;
    }

    try {
      await registerUser.mutateAsync({
        data: {
          tenantId: 1,
          firstName,
          lastName,
          birthDate,
          initials: initials.toUpperCase(),
          pin,
        },
      });
      setSuccess(`Mitarbeiter ${firstName} ${lastName} wurde erfolgreich registriert mit Kürzel "${initials.toUpperCase()}".`);
      setFirstName("");
      setLastName("");
      setBirthDate("");
      setInitials("");
      setPin("");
      setPinConfirm("");
      setSuggestions([]);
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Registrierung fehlgeschlagen.";
      setError(msg);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="bg-[#1a3a6b] text-white px-6 py-3 flex items-center gap-3">
        <UserPlus className="h-5 w-5" />
        <h2 className="text-lg font-bold">Mitarbeiter Registrierung</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-sm text-green-700">
            <Check className="h-4 w-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Vorname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="z.B. Anna"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Nachname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="z.B. Schmidt"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Geburtsdatum <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Kürzel (2-3 Buchstaben) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 3))}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="z.B. AS"
              maxLength={3}
            />
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground">Vorschläge:</span>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInitials(s)}
                    className={cn(
                      "px-2 py-0.5 text-xs font-mono font-bold rounded-md border transition-colors",
                      initials === s
                        ? "bg-primary text-white border-primary"
                        : "bg-secondary text-foreground border-border hover:bg-primary/10 hover:border-primary"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              4-stelliger PIN <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").substring(0, 4))}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                placeholder="****"
                maxLength={4}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              PIN bestätigen <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").substring(0, 4))}
                className={cn(
                  "w-full border rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 transition-all pr-10",
                  pinConfirm && pin !== pinConfirm
                    ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                    : "border-border focus:ring-primary/20 focus:border-primary"
                )}
                placeholder="****"
                maxLength={4}
              />
              {pinConfirm && pin === pinConfirm && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {pinConfirm && pin !== pinConfirm && (
                <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={registerUser.isPending}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          {registerUser.isPending ? "Wird registriert..." : "Mitarbeiter registrieren"}
        </button>
      </form>
    </div>
  );
}

function UserList() {
  const { data: users, refetch } = useListUsers({ tenantId: 1 });
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetInitials, setResetInitials] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [resetError, setResetError] = useState("");
  const resetCredentials = useResetUserCredentials();

  const registeredUsers = users?.filter((u) => u.isRegistered) || [];

  const handleReset = async (userId: number) => {
    setResetError("");

    if (!resetInitials || resetInitials.length < 2 || resetInitials.length > 3) {
      setResetError("Kürzel muss 2-3 Buchstaben lang sein.");
      return;
    }
    if (!resetPin || resetPin.length !== 4 || !/^\d{4}$/.test(resetPin)) {
      setResetError("PIN muss genau 4 Ziffern enthalten.");
      return;
    }

    try {
      await resetCredentials.mutateAsync({
        userId,
        data: { initials: resetInitials.toUpperCase(), pin: resetPin },
      });
      setResetUserId(null);
      setResetInitials("");
      setResetPin("");
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Zurücksetzen fehlgeschlagen.";
      setResetError(msg);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="bg-[#1a3a6b] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-bold">1.2 Kürzelliste — Registrierte Mitarbeiter</h2>
        </div>
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
          {registeredUsers.length} Mitarbeiter
        </span>
      </div>

      {registeredUsers.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Noch keine Mitarbeiter registriert.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Nutzen Sie das Formular oben, um Mitarbeiter zu registrieren.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kürzel
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Geburtsdatum
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Rolle
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Registriert am
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin-Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {registeredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/40 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center h-9 w-12 bg-primary/10 text-primary font-mono font-bold text-sm rounded-lg">
                      {user.initials || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-foreground">{user.name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.birthDate
                      ? new Date(user.birthDate).toLocaleDateString("de-DE")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                        user.role === "SUPERADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "ADMIN"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {user.role === "SUPERADMIN" || user.role === "ADMIN" ? (
                        <Shield className="h-3 w-3" />
                      ) : null}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {resetUserId === user.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        {resetError && (
                          <span className="text-xs text-red-500">{resetError}</span>
                        )}
                        <input
                          type="text"
                          value={resetInitials}
                          onChange={(e) =>
                            setResetInitials(
                              e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 3)
                            )
                          }
                          className="w-16 border border-border rounded-lg px-2 py-1 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Kürzel"
                          maxLength={3}
                        />
                        <input
                          type="text"
                          value={resetPin}
                          onChange={(e) =>
                            setResetPin(e.target.value.replace(/\D/g, "").substring(0, 4))
                          }
                          className="w-16 border border-border rounded-lg px-2 py-1 text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="PIN"
                          maxLength={4}
                        />
                        <button
                          onClick={() => handleReset(user.id)}
                          disabled={resetCredentials.isPending}
                          className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setResetUserId(null);
                            setResetError("");
                          }}
                          className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setResetUserId(user.id);
                          setResetInitials(user.initials || "");
                          setResetPin("");
                          setResetError("");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Kürzel/PIN zurücksetzen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
