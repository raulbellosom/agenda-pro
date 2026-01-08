import React from "react";
import { Bell, BellOff, Check, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useRequestNotificationPermission } from "../../lib/hooks/useNotifications";

/**
 * Component to request notification permissions
 * Shows different states: default, requesting, granted, denied
 */
export function NotificationPermissionPrompt({ onClose }) {
  const {
    permission,
    hasPermission,
    isDenied,
    isRequesting,
    requestPermission,
    fcmToken,
  } = useRequestNotificationPermission();

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      setTimeout(() => {
        onClose?.();
      }, 2000);
    }
  };

  // Don't show if already granted
  if (hasPermission && fcmToken) {
    return (
      <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              ¡Notificaciones habilitadas!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Recibirás notificaciones en tiempo real sobre tus eventos y
              recordatorios.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-green-600 dark:text-green-400 hover:text-green-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </Card>
    );
  }

  // Show if permission denied
  if (isDenied) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
            <BellOff className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Notificaciones bloqueadas
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Para habilitar las notificaciones, debes cambiar la configuración
              de tu navegador:
            </p>
            <ol className="text-sm text-red-700 dark:text-red-300 mt-2 ml-4 list-decimal">
              <li>
                Haz clic en el ícono de candado 🔒 en la barra de direcciones
              </li>
              <li>Busca "Notificaciones" y selecciona "Permitir"</li>
              <li>Recarga esta página</li>
            </ol>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-red-600 dark:text-red-400 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </Card>
    );
  }

  // Default: show prompt to request permission
  return (
    <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
          <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            Habilita las notificaciones
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Recibe notificaciones en tiempo real sobre eventos, recordatorios e
            invitaciones, incluso cuando no estés usando la app.
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              size="sm"
            >
              {isRequesting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Solicitando permiso...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Habilitar notificaciones
                </>
              )}
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                Ahora no
              </Button>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </Card>
  );
}
