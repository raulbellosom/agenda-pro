/**
 * Workspace Context
 * Maneja el grupo activo y proporciona acceso a datos comunes
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "./AuthProvider";
import { useProfile } from "../../lib/hooks/useProfile";
import { useGroups, useCreateGroup } from "../../lib/hooks/useGroups";
import { useCalendars } from "../../lib/hooks/useCalendars";

const WorkspaceContext = createContext(null);

// Key para localStorage
const ACTIVE_GROUP_KEY = "agenda_pro_active_group";

export function WorkspaceProvider({ children }) {
  const { state: authState } = useAuth();
  const isAuthenticated = authState.status === "authed";
  const userId = authState.user?.$id;

  // Estado del grupo activo
  const [activeGroupId, setActiveGroupId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ACTIVE_GROUP_KEY) || null;
    }
    return null;
  });

  // Queries
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile(userId);

  const {
    data: groups,
    isLoading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups,
  } = useGroups(profile?.$id);

  const {
    data: calendars,
    isLoading: calendarsLoading,
    refetch: refetchCalendars,
  } = useCalendars(activeGroupId);

  // Mutation para crear grupo
  const createGroupMutation = useCreateGroup();

  // Grupo activo actual
  const activeGroup = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    if (activeGroupId) {
      const found = groups.find((g) => g.$id === activeGroupId);
      if (found) return found;
    }
    // Si no hay grupo seleccionado o no se encontró, usar el primero
    return groups[0];
  }, [groups, activeGroupId]);

  // Actualizar el grupo activo cuando cambie
  useEffect(() => {
    if (activeGroup && activeGroup.$id !== activeGroupId) {
      setActiveGroupId(activeGroup.$id);
      localStorage.setItem(ACTIVE_GROUP_KEY, activeGroup.$id);
    }
  }, [activeGroup, activeGroupId]);

  // Función para cambiar el grupo activo
  const switchGroup = useCallback((groupId) => {
    setActiveGroupId(groupId);
    localStorage.setItem(ACTIVE_GROUP_KEY, groupId);
  }, []);

  // Función para crear el primer grupo si no existe
  const createFirstGroup = useCallback(
    async (groupName = "Mi espacio") => {
      if (!profile) return null;

      const result = await createGroupMutation.mutateAsync({
        data: { name: groupName },
        ownerProfileId: profile.$id,
      });

      setActiveGroupId(result.$id);
      localStorage.setItem(ACTIVE_GROUP_KEY, result.$id);
      return result;
    },
    [profile, createGroupMutation]
  );

  // Estado de carga general
  const isLoading = profileLoading || groupsLoading;

  // Determinar si necesitamos crear el primer grupo
  const needsFirstGroup = !isLoading && groups && groups.length === 0;

  // Valor del contexto
  const value = useMemo(
    () => ({
      // Estados
      isAuthenticated,
      isLoading,
      needsFirstGroup,

      // Perfil
      profile,
      profileLoading,
      profileError,

      // Grupos
      groups: groups || [],
      groupsLoading,
      groupsError,
      activeGroup,
      activeGroupId: activeGroup?.$id,
      switchGroup,
      createFirstGroup,
      refetchGroups,
      isCreatingGroup: createGroupMutation.isPending,

      // Calendarios del grupo activo
      calendars: calendars || [],
      calendarsLoading,
      refetchCalendars,

      // Helpers
      isOwner: activeGroup?.membershipRole === "OWNER",
    }),
    [
      isAuthenticated,
      isLoading,
      needsFirstGroup,
      profile,
      profileLoading,
      profileError,
      groups,
      groupsLoading,
      groupsError,
      activeGroup,
      switchGroup,
      createFirstGroup,
      refetchGroups,
      createGroupMutation.isPending,
      calendars,
      calendarsLoading,
      refetchCalendars,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
