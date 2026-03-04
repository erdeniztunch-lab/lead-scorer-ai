import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isGuestSession } from "@/lib/session";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    setIsAllowed(isGuestSession());
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Checking session...</div>;
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
