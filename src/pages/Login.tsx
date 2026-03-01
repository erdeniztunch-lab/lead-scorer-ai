import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/lib/session";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const handleLogin = () => {
    login();
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
            This is a basic Phase 1 session gate. Continue to access the dashboard workspace.
          </p>
          <Button className="w-full" onClick={handleLogin}>
            Continue
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
