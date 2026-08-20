import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "ad-licoreria-focus-mode";

type FocusModeContextValue = {
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
  toggleFocusMode: () => void;
};

const FocusModeContext = createContext<FocusModeContextValue | null>(null);

function readStoredFocusMode(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredFocusMode(value: boolean) {
  try {
    sessionStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function AdFocusModeProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusModeState] = useState(readStoredFocusMode);

  const setFocusMode = useCallback((value: boolean) => {
    setFocusModeState(value);
    writeStoredFocusMode(value);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setFocusModeState((prev) => {
      const next = !prev;
      writeStoredFocusMode(next);
      return next;
    });
  }, []);

  useEffect(() => {
    writeStoredFocusMode(focusMode);
  }, [focusMode]);

  const value = useMemo(
    () => ({ focusMode, setFocusMode, toggleFocusMode }),
    [focusMode, setFocusMode, toggleFocusMode],
  );

  return (
    <FocusModeContext.Provider value={value}>{children}</FocusModeContext.Provider>
  );
}

export function useAdFocusMode(): FocusModeContextValue {
  const ctx = useContext(FocusModeContext);
  if (!ctx) {
    throw new Error("useAdFocusMode debe usarse dentro de AdFocusModeProvider");
  }
  return ctx;
}
