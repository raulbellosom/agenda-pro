import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { account, databases, functions } from "../../lib/appwrite";
import { env } from "../../shared/appwrite/env";

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
      setState({ status: "authed", user });
    } catch {
      setState({ status: "guest" });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email, password) {
    await account.createEmailPasswordSession(email, password);
    await refresh();
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

    // Function created the user, now create a session
    await account.createEmailPasswordSession(
      email.toLowerCase().trim(),
      password
    );
    await refresh();
  }

  async function logout() {
    try {
      await account.deleteSession("current");
    } finally {
      setState({ status: "guest" });
    }
  }

  const value = useMemo(
    () => ({ state, login, register, logout, refresh }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
