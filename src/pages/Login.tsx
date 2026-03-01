import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ensureUserBootstrap, isAuthenticated, login, register } from "@/lib/session";

type AuthMode = "signin" | "signup";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

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

  const handleSubmit = async () => {
    setErrorText("");
    setSuccessText("");
    if (!email.trim() || !password.trim()) {
      setErrorText("Email and password are required.");
      return;
    }
    if (mode === "signup" && password.trim().length < 8) {
      setErrorText("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    if (mode === "signin") {
      const result = await login(email.trim(), password);
      if (result.error) {
        setIsLoading(false);
        setErrorText(result.error);
        return;
      }

      const bootstrap = await ensureUserBootstrap(companyName.trim());
      setIsLoading(false);
      if (!bootstrap.ok) {
        setErrorText(bootstrap.error ?? "Failed to initialize account.");
        return;
      }

      navigate(redirectTo, { replace: true });
      return;
    }

    const registerResult = await register(email.trim(), password);
    if (registerResult.error) {
      setIsLoading(false);
      setErrorText(registerResult.error);
      return;
    }

    if (registerResult.requiresEmailConfirmation) {
      setIsLoading(false);
      setSuccessText("Account created. Confirm your email, then sign in.");
      setMode("signin");
      return;
    }

    const bootstrap = await ensureUserBootstrap(companyName.trim());
    setIsLoading(false);
    if (!bootstrap.ok) {
      setErrorText(bootstrap.error ?? "Failed to initialize account.");
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
            {mode === "signin"
              ? "Sign in with your Supabase account to access your dashboard workspace."
              : "Create a new workspace account with email and password."}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "signin" ? "default" : "outline"}
              onClick={() => {
                setMode("signin");
                setErrorText("");
                setSuccessText("");
              }}
              disabled={isLoading}
            >
              Sign in
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => {
                setMode("signup");
                setErrorText("");
                setSuccessText("");
              }}
              disabled={isLoading}
            >
              Register
            </Button>
          </div>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
          <Input
            type="text"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Workspace name (optional)"
            autoComplete="organization"
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
          {errorText && <p className="text-sm text-destructive">{errorText}</p>}
          {successText && <p className="text-sm text-emerald-600">{successText}</p>}
          <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
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
