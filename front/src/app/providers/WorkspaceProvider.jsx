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
      const saved = localStorage.getItem(ACTIVE_GROUP_KEY);
      return saved || null;
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
  } = useCalendars(activeGroupId, profile?.$id);

  // Mutation para crear grupo
  const createGroupMutation = useCreateGroup();

  // Grupo activo actual
  const activeGroup = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    // Permitir explícitamente null para "sin grupo" (solo calendarios personales)
    if (activeGroupId === null || activeGroupId === "null") {
      return null;
    }
    if (activeGroupId) {
      const found = groups.find((g) => g.$id === activeGroupId);
      if (found) return found;
      // Si el grupo guardado no existe, NO seleccionar automáticamente otro
      // Mantener null para que el usuario elija
      return null;
    }
    return null;
  }, [groups, activeGroupId]);

  // Limpiar activeGroupId si el grupo guardado ya no existe
  useEffect(() => {
    // Solo actuar cuando los grupos hayan terminado de cargar Y tengamos datos
    if (groupsLoading || groups === undefined) {
      return;
    }

    // Si ya cargó y no hay grupos, limpiar el activeGroupId
    if (groups.length === 0) {
      if (activeGroupId !== null) {
        setActiveGroupId(null);
        localStorage.removeItem(ACTIVE_GROUP_KEY);
      }
    } else if (activeGroupId && activeGroupId !== "null") {
      // Verificar si el grupo guardado todavía existe
      const found = groups.find((g) => g.$id === activeGroupId);
      if (!found) {
        setActiveGroupId(null);
        localStorage.removeItem(ACTIVE_GROUP_KEY);
      }
    }
  }, [activeGroupId, groups, groupsLoading]);

  // Función para cambiar el grupo activo
  const switchGroup = useCallback((groupId) => {
    setActiveGroupId(groupId);
    if (groupId === null) {
      localStorage.removeItem(ACTIVE_GROUP_KEY);
    } else {
      localStorage.setItem(ACTIVE_GROUP_KEY, groupId);
    }
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

      // Calendarios (personales + del grupo activo si hay)
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
