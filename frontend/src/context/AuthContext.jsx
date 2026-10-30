import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // corrupted storage — stay null
    }
    setLoading(false);
  }, []);

  const saveAuth = useCallback((userData, token) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem("auth_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, saveAuth, clearAuth, updateUser }),
    [user, loading, saveAuth, clearAuth, updateUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
