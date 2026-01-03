import { NotFoundPage as StatusNotFoundPage } from "../../shared/ui/StatusPage";

export function NotFoundPage() {
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
