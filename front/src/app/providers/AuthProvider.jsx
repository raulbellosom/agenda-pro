import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { account, databases, functions } from "../../lib/appwrite";
import { env } from "../../shared/appwrite/env";
import { Query } from "appwrite";

const AuthContext = createContext(null);

// Database and collection IDs from env
const DATABASE_ID = env.databaseId;
const USERS_PROFILE_COLLECTION = env.collectionUsersProfileId;

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading" });

  async function refresh() {
    setState({ status: "loading" });
    try {
      const user = await account.get();

      // Verificar si el email está verificado en el perfil
      const profileDocs = await databases.listDocuments(
        DATABASE_ID,
        USERS_PROFILE_COLLECTION,
        [Query.equal("userAuthId", user.$id), Query.limit(1)]
      );

      if (profileDocs.documents.length > 0) {
        const profile = profileDocs.documents[0];

        // Si el email no está verificado, cerrar sesión
        if (!profile.emailVerified) {
          await account.deleteSession("current");
          setState({
            status: "guest",
            emailNotVerified: true,
            email: profile.email,
          });
          return;
        }
      }

      setState({ status: "authed", user });
    } catch {
      setState({ status: "guest" });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email, password) {
    try {
      // Primero verificar si el email está verificado ANTES de crear sesión
      // Necesitamos crear una sesión temporal para verificar
      await account.createEmailPasswordSession(email, password);

      // Ahora verificar el perfil
      const user = await account.get();
      const profileDocs = await databases.listDocuments(
        DATABASE_ID,
        USERS_PROFILE_COLLECTION,
        [Query.equal("userAuthId", user.$id), Query.limit(1)]
      );

      if (profileDocs.documents.length > 0) {
        const profile = profileDocs.documents[0];

        // Si el email NO está verificado, cerrar sesión y rechazar login
        if (!profile.emailVerified) {
          await account.deleteSession("current");
          setState({
            status: "guest",
            emailNotVerified: true,
            email: profile.email,
          });
          throw new Error(
            "Debes verificar tu email antes de iniciar sesión. Revisa tu correo."
          );
        }
      }

      // Email verificado - actualizar estado
      await refresh();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register a new user using the Appwrite Function
   * The function creates both Auth user AND users_profile in one atomic operation
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - Full display name
   * @param {string} firstName - First name for profile
   * @param {string} lastName - Last name for profile
   */
  async function register(email, password, name, firstName, lastName) {
    const fnId = env.fnCreateUserWithProfileId;

    if (!fnId) {
      throw new Error(
        "Function ID not configured. Set VITE_APPWRITE_FN_CREATE_USER_WITH_PROFILE_ID in .env"
      );
    }

    // Call the Appwrite Function to create user + profile atomically
    const execution = await functions.createExecution(
      fnId,
      JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
        name,
        firstName,
        lastName,
      }),
      false, // async = false (wait for response)
      "/", // path
      "POST" // method
    );

    // Parse the function response
    let result;
    try {
      result = JSON.parse(execution.responseBody);
    } catch {
      throw new Error("Invalid response from registration function");
    }

    if (!result.ok) {
      throw new Error(result.error || "Registration failed");
    }

    // Enviar email de verificación usando la función unificada
    const fnEmailVerification = env.fnEmailVerificationId;
    if (fnEmailVerification && result.user) {
      try {
        await functions.createExecution(
          fnEmailVerification,
          JSON.stringify({
            action: "send",
            userAuthId: result.user.$id,
            email: email.toLowerCase().trim(),
          }),
          false,
          "/",
          "POST"
        );
      } catch (error) {
        // No fallar el registro si el email falla
      }
    }

    // NO crear sesión automáticamente - el usuario debe verificar su email primero
    // await account.createEmailPasswordSession(email.toLowerCase().trim(), password);
    // await refresh();

    // Actualizar estado para mostrar que debe verificar email
    setState({
      status: "guest",
      emailNotVerified: true,
      email: email.toLowerCase().trim(),
      registrationSuccess: true,
    });
  }

  async function logout() {
    try {
      await account.deleteSession("current");
    } finally {
      setState({ status: "guest" });
    }
  }

  async function resendVerificationEmail(email) {
    const fnId = env.fnEmailVerificationId;

    if (!fnId) {
      throw new Error("Email verification function not configured");
    }

    const execution = await functions.createExecution(
      fnId,
      JSON.stringify({
        action: "resend",
        email,
      }),
      false,
      "/",
      "POST"
    );

    let result;
    try {
      result = JSON.parse(execution.responseBody);
    } catch {
      throw new Error("Invalid response from resend function");
    }

    if (!result.ok) {
      throw new Error(result.error || "Failed to resend verification email");
    }

    return result;
  }

  const value = useMemo(
    () => ({
      state,
      login,
      register,
      logout,
      refresh,
      resendVerificationEmail,
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
