import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthGuard({ children, setPage }) {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) setPage("login");
  }, [user, setPage]);
  if (!user) return null;
  return children;
}
