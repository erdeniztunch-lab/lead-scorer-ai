import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isAuthenticated, loginAsGuest } from "@/lib/session";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const ok = await isAuthenticated();
      if (mounted && ok) {
        navigate(redirectTo, { replace: true });
      }
    };
    void check();
    return () => {
      mounted = false;
    };
  }, [navigate, redirectTo]);

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Prototype Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Backend is disabled for prototype mode. Continue as guest to use the product flow.</p>
          <Input type="email" placeholder="you@company.com" disabled />
          <Input type="text" placeholder="Workspace name (optional)" disabled />
          <Input type="password" placeholder="Password" disabled />
          <Button variant="secondary" className="w-full" onClick={handleGuestLogin}>
            Continue as guest (no saved data)
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
            Back to landing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
