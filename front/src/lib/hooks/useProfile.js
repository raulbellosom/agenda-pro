/**
 * React Query hooks para Profile
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import * as profileService from "../services/profileService";

/**
 * Hook para obtener el perfil del usuario actual
 */
export function useProfile(userAuthId) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFILE, userAuthId],
    queryFn: () => profileService.getProfileByAuthId(userAuthId),
    enabled: !!userAuthId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para actualizar el perfil
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, data }) =>
      profileService.updateProfile(profileId, data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(
        [QUERY_KEYS.PROFILE, updatedProfile.userAuthId],
        updatedProfile
      );
    },
  });
}

/**
 * Hook para cambiar la contraseña
 */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: ({ newPassword, oldPassword }) =>
      profileService.updatePassword(newPassword, oldPassword),
  });
}

/**
 * Hook para cambiar el email
 */
export function useUpdateEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, newEmail, password }) =>
      profileService.updateEmail(profileId, newEmail, password),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(
        [QUERY_KEYS.PROFILE, updatedProfile.userAuthId],
        updatedProfile
      );
    },
  });
}

/**
 * Hook para subir avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, file }) =>
      profileService.uploadAvatar(profileId, file),
    onSuccess: ({ profile }) => {
      queryClient.setQueryData(
        [QUERY_KEYS.PROFILE, profile.userAuthId],
        profile
      );
    },
  });
}

/**
 * Hook para eliminar avatar
 */
export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId) => profileService.deleteAvatar(profileId),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(
        [QUERY_KEYS.PROFILE, updatedProfile.userAuthId],
        updatedProfile
      );
    },
  });
}

/**
 * Helper para obtener URL del avatar
 */
export { getAvatarUrl } from "../services/profileService";
