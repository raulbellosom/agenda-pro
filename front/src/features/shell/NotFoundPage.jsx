import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-[26px] font-semibold">Página no encontrada</div>
        <p className="mt-2 text-white/65">Regresa al inicio para continuar.</p>
        <div className="mt-6">
          <Link to="/">
            <Button size="lg">Ir a Agenda</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
