/**
 * React Query hooks para User Settings
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import * as userSettingsService from "../services/userSettingsService";

/**
 * Hook para obtener las preferencias globales del usuario
 */
export function useUserSettings(profileId) {
  return useQuery({
    queryKey: [QUERY_KEYS.USER_SETTINGS, profileId],
    queryFn: () => userSettingsService.getOrCreateUserSettings(profileId),
    enabled: !!profileId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para actualizar preferencias
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, data }) =>
      userSettingsService.upsertUserSettings(profileId, data),
    onSuccess: (updatedSettings, variables) => {
      queryClient.setQueryData(
        [QUERY_KEYS.USER_SETTINGS, variables.profileId],
        updatedSettings
      );
    },
  });
}

// Re-exportar opciones para uso en componentes
export { SETTINGS_OPTIONS } from "../services/userSettingsService";
