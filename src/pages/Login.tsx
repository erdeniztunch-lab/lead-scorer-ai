import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isAuthenticated, login } from "@/lib/session";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

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

  const handleLogin = async () => {
    setErrorText("");
    if (!email.trim() || !password.trim()) {
      setErrorText("Email and password are required.");
      return;
    }
    setIsLoading(true);
    const result = await login(email.trim(), password);
    setIsLoading(false);
    if (result.error) {
      setErrorText(result.error);
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In to LeadScorer.ai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign in with your Supabase account to access your dashboard workspace.
          </p>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
          {errorText && <p className="text-sm text-destructive">{errorText}</p>}
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
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
