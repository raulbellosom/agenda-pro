import { LogIn, UserPlus } from "lucide-react";
import { NotFoundPage as StatusNotFoundPage } from "../../shared/ui/StatusPage";
import { useAuth } from "../../app/providers/AuthProvider";

export function NotFoundPage() {
  const { state } = useAuth();
  const isAuthed = state.status === "authed";
  const isLoading = state.status === "loading";

  // While loading, show guest options to be safe
  if (!isAuthed || isLoading) {
    return (
      <StatusNotFoundPage
        homeRoute="/login"
        homeLabel="Ir a login"
        showBackButton={false}
        actions={[
          {
            label: "Iniciar sesión",
            to: "/login",
            icon: LogIn,
          },
          {
            label: "Crear cuenta",
            to: "/register",
            icon: UserPlus,
            variant: "outline",
          },
        ]}
        quickLinks={[]}
      />
    );
  }

  return (
    <StatusNotFoundPage
      homeRoute="/"
      homeLabel="Ir a Agenda"
      quickLinks={[
        { label: "Calendario", to: "/" },
        { label: "Configuración", to: "/settings" },
      ]}
    />
  );
}
