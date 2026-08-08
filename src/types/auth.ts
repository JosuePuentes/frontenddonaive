import type { Role } from "@/constants/permissions";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthSession = {
  user: AuthUser | null;
  isAuthenticated: boolean;
};

export type AuthState = AuthSession & {
  status: "anonymous" | "ready";
};
