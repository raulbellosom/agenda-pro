import React, { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { Calendar, Bell, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { Button } from "../../components/ui/Button";

export function AppShell() {
  const { state, logout } = useAuth();
  const [active, setActive] = useState("calendar");

  const items = useMemo(
    () => [
      { key: "calendar", label: "Agenda", icon: <Calendar size={22} /> },
      { key: "alerts", label: "Avisos", icon: <Bell size={22} /> },
      { key: "settings", label: "Ajustes", icon: <Settings size={22} /> }
    ],
    []
  );

  const userName = state.status === "authed" ? (state.user.name || "Usuario") : "Usuario";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 backdrop-blur bg-black/25 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] text-white/55">Hola,</div>
            <div className="truncate text-[18px] font-semibold">{userName}</div>
          </div>

          <Button variant="ghost" onClick={logout} leftIcon={<LogOut size={18} />} title="Cerrar sesión">
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 pb-28">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/40 backdrop-blur border-t border-white/10">
        <div className="mx-auto max-w-6xl px-3 py-2 grid grid-cols-3 gap-2">
          {items.map((it) => {
            const isActive = it.key === active;
            return (
              <button
                key={it.key}
                onClick={() => setActive(it.key)}
                className={[
                  "min-h-[var(--tap)] rounded-[18px] px-3 flex items-center justify-center gap-2",
                  "border border-white/10",
                  isActive ? "bg-white/10" : "bg-transparent hover:bg-white/8"
                ].join(" ")}
              >
                <span className={isActive ? "text-[rgb(var(--brand-2))]" : "text-white/70"}>{it.icon}</span>
                <span className={isActive ? "text-white" : "text-white/70"}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
