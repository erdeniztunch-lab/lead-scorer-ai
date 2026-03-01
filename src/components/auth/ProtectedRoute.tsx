import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ensureUserBootstrap, onAuthStateChange } from "@/lib/session";
import { apiFetch } from "@/lib/apiClient";

interface ProtectedRouteProps {
  children: JSX.Element;
}

async function verifySessionWithBackend(): Promise<boolean> {
  const response = await apiFetch("/api/auth/me", { method: "GET" });

  return response.ok;
}

async function verifyAndBootstrap(): Promise<boolean> {
  const isValidSession = await verifySessionWithBackend();
  if (!isValidSession) {
    return false;
  }
  const bootstrap = await ensureUserBootstrap();
  return bootstrap.ok;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const ok = await verifyAndBootstrap();
      if (!mounted) {
        return;
      }
      setIsAllowed(ok);
      setIsChecking(false);
    };

    void run();

    const subscription = onAuthStateChange(async () => {
      const ok = await verifyAndBootstrap();
      if (!mounted) {
        return;
      }
      setIsAllowed(ok);
      setIsChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isChecking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Checking session...</div>;
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
