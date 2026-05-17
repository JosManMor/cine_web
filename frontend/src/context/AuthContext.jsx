import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

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

  return (
    <AuthContext.Provider value={{ user, saveAuth, clearAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
