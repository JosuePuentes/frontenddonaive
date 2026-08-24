import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  activateLicense,
  clearLicense,
  loadLicense,
  type DsLicense,
} from "@/lib/donaive-software/license";
import {
  ensureDefaultAdmin,
  loadRoleMatrix,
  loadUsers,
  logout as authLogout,
  resolveCurrentUser,
  setRolePermissions as persistRolePermissions,
  upsertUser as persistUpsertUser,
  authenticate,
  type UpsertUserInput,
} from "@/lib/donaive-software/auth";
import {
  hasAnyPermission,
  hasPermission,
} from "@/lib/donaive-software/access";
import {
  loadProducts,
  loadRates,
  receiveStock,
  saveProducts,
  saveRates,
  type DsProductDemo,
  type DsRatesState,
} from "@/lib/donaive-software/store";
import type { DsPermission, DsRole, DsUser } from "@/types/donaive-software";

type Ctx = {
  license: DsLicense | null;
  rates: DsRatesState;
  products: DsProductDemo[];
  currentUser: DsUser | null;
  users: DsUser[];
  roleMatrix: Partial<Record<DsRole, DsPermission[]>>;
  activate: (businessName: string, licenseKey?: string) => void;
  deactivate: () => void;
  login: (username: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  refreshUsers: () => void;
  upsertUser: (input: UpsertUserInput) => { ok: true; user: DsUser } | { ok: false; error: string };
  setRolePermissions: (input: {
    role: DsRole;
    permissions: DsPermission[];
  }) => { ok: true } | { ok: false; error: string };
  can: (permission: DsPermission) => boolean;
  canAny: (permissions: DsPermission[]) => boolean;
  setBcv: (rate: number) => void;
  setProtectedRate: (rate: number) => void;
  applyPurchaseCpp: (
    productId: string,
    qtyBase: number,
    unitCostUsd: number,
  ) => void;
};

const DonaiveSoftwareContext = createContext<Ctx | null>(null);

export function DonaiveSoftwareProvider({ children }: { children: ReactNode }) {
  const [license, setLicense] = useState<DsLicense | null>(null);
  const [rates, setRates] = useState<DsRatesState>(() => loadRates());
  const [products, setProducts] = useState<DsProductDemo[]>([]);
  const [currentUser, setCurrentUser] = useState<DsUser | null>(null);
  const [users, setUsers] = useState<DsUser[]>([]);
  const [roleMatrix, setRoleMatrix] = useState<
    Partial<Record<DsRole, DsPermission[]>>
  >({});
  const [ready, setReady] = useState(false);

  const refreshUsers = useCallback(() => {
    setUsers(loadUsers());
    setRoleMatrix(loadRoleMatrix());
    setCurrentUser(resolveCurrentUser());
  }, []);

  useEffect(() => {
    setLicense(loadLicense());
    setRates(loadRates());
    setProducts(loadProducts());
    setUsers(loadUsers());
    setRoleMatrix(loadRoleMatrix());
    setCurrentUser(resolveCurrentUser());
    setReady(true);
  }, []);

  const activate = useCallback((businessName: string, licenseKey?: string) => {
    const next = activateLicense({ businessName, licenseKey });
    ensureDefaultAdmin();
    setLicense(next);
    refreshUsers();
  }, [refreshUsers]);

  const deactivate = useCallback(() => {
    clearLicense();
    authLogout();
    setLicense(null);
    setCurrentUser(null);
  }, []);

  const login = useCallback((username: string, password: string) => {
    const r = authenticate(username, password);
    if (!r.ok) return r;
    setCurrentUser(r.user);
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setCurrentUser(null);
  }, []);

  const upsertUser = useCallback(
    (input: UpsertUserInput) => {
      const r = persistUpsertUser(input);
      if (r.ok) refreshUsers();
      return r;
    },
    [refreshUsers],
  );

  const setRolePermissions = useCallback(
    (input: { role: DsRole; permissions: DsPermission[] }) => {
      const r = persistRolePermissions(input);
      if (r.ok) refreshUsers();
      return r;
    },
    [refreshUsers],
  );

  const canAccess = useCallback(
    (permission: DsPermission) =>
      hasPermission(currentUser, permission, roleMatrix),
    [currentUser, roleMatrix],
  );

  const canAny = useCallback(
    (permissions: DsPermission[]) =>
      hasAnyPermission(currentUser, permissions, roleMatrix),
    [currentUser, roleMatrix],
  );

  const setBcv = useCallback((rate: number) => {
    setRates((prev) => {
      const next = {
        ...prev,
        bcv: rate,
        updatedAt: new Date().toISOString(),
      };
      saveRates(next);
      return next;
    });
  }, []);

  const setProtectedRate = useCallback((rate: number) => {
    setRates((prev) => {
      const next = {
        ...prev,
        protectedRate: rate,
        updatedAt: new Date().toISOString(),
      };
      saveRates(next);
      return next;
    });
  }, []);

  const applyPurchaseCpp = useCallback(
    (productId: string, qtyBase: number, unitCostUsd: number) => {
      setProducts((prev) => {
        const next = receiveStock(prev, productId, qtyBase, unitCostUsd);
        saveProducts(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      license,
      rates,
      products,
      currentUser,
      users,
      roleMatrix,
      activate,
      deactivate,
      login,
      logout,
      refreshUsers,
      upsertUser,
      setRolePermissions,
      can: canAccess,
      canAny,
      setBcv,
      setProtectedRate,
      applyPurchaseCpp,
    }),
    [
      license,
      rates,
      products,
      currentUser,
      users,
      roleMatrix,
      activate,
      deactivate,
      login,
      logout,
      refreshUsers,
      upsertUser,
      setRolePermissions,
      canAccess,
      canAny,
      setBcv,
      setProtectedRate,
      applyPurchaseCpp,
    ],
  );

  if (!ready) return null;

  return (
    <DonaiveSoftwareContext.Provider value={value}>
      {children}
    </DonaiveSoftwareContext.Provider>
  );
}

export function useDonaiveSoftware() {
  const ctx = useContext(DonaiveSoftwareContext);
  if (!ctx) {
    throw new Error("useDonaiveSoftware debe usarse dentro del provider");
  }
  return ctx;
}
