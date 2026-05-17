import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function VerifiedGuard({ children, setPage }) {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) setPage("login");
    else if (user.verified === false) setPage("email-pending");
  }, [user, setPage]);
  if (!user || user.verified === false) return null;
  return children;
}
