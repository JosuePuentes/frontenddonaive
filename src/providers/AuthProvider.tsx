import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { AuthState, AuthUser } from "@/types/auth";

type AuthContextValue = AuthState & {
  /**
   * Placeholder for future auth actions.
   * Intentionally does not persist tokens or call APIs.
   */
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const value = useMemo<AuthContextValue>(
    () => ({
      status: "ready",
      user: null,
      isAuthenticated: false,
      setUser: () => {
        // Stub: future auth wiring will replace this no-op.
      },
    }),
    [],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
