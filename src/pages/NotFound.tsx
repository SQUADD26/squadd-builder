import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <img src="/squadd-logo.svg" alt="Squadd" className="h-20 mx-auto" />
        <h1 className="font-mono text-7xl font-bold tracking-tighter text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">Pagina non trovata</p>
        <Button onClick={() => navigate("/")} variant="outline" className="font-mono">
          Torna al Builder
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
