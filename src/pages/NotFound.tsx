import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const playerId = query.get('player');

    if (location.pathname.startsWith('/shot-tracker') && playerId) {
      window.location.replace(`/player/${playerId}/shots`);
      return;
    }

    console.error("404 Error: User attempted to access non-existent route:", `${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
