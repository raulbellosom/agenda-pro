import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

/**
 * Componente para mostrar un prompt de instalación de PWA
 * Se muestra automáticamente en dispositivos móviles si la app no está instalada
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada como PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://");

    setIsStandalone(standalone);

    // Detectar si es iOS
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Verificar si el usuario ya descartó el prompt
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    // No mostrar si está instalada, o si fue descartado hace menos de 7 días
    if (standalone || (dismissedTime && now - dismissedTime < sevenDays)) {
      return;
    }

    // Para Android/Chrome - capturar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar después de 3 segundos
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Para iOS - mostrar instrucciones después de 3 segundos si es móvil
    if (iOS && !standalone) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // En iOS, no hay API de instalación, solo mostramos instrucciones
      return;
    }

    // Mostrar el prompt nativo de instalación
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("Usuario aceptó instalar la PWA");
    } else {
      console.log("Usuario rechazó instalar la PWA");
    }

    // Limpiar el prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Guardar la fecha de descarte
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // No mostrar nada si ya está instalada o no debe mostrarse
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        >
          <Card className="p-4 shadow-2xl border-2 border-[rgb(var(--brand-primary))]">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="shrink-0 w-12 h-12 rounded-xl bg-[rgb(var(--brand-primary))]/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-[rgb(var(--brand-primary))]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-[rgb(var(--text-primary))]">
                  Instala Agenda Pro
                </h3>

                {isIOS ? (
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                    Toca el botón de compartir{" "}
                    <span className="inline-block">
                      <svg
                        className="w-4 h-4 inline"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                      </svg>
                    </span>{" "}
                    y luego "Agregar a pantalla de inicio"
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                    Accede más rápido y disfruta de una experiencia de app
                    nativa
                  </p>
                )}

                {/* Buttons */}
                <div className="mt-3 flex items-center gap-2">
                  {!isIOS && deferredPrompt && (
                    <Button
                      onClick={handleInstallClick}
                      size="sm"
                      className="flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      Instalar
                    </Button>
                  )}

                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-[rgb(var(--text-muted))]"
                  >
                    Ahora no
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook para verificar si la app está instalada como PWA
 */
export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://");

    setIsPWA(standalone);
  }, []);

  return isPWA;
}

/**
 * Hook para obtener el evento de instalación de PWA
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }

    return false;
  };

  return { isInstallable, install };
}
