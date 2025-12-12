import React, { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { usePathname } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const pathname = usePathname();
  const { status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: pathname });
    }
  }, [status, pathname]);
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  if (status === "unauthenticated") {
    return null; // Don't render children while redirecting
  }
  return <>{children}</>;
};

export default ProtectedRoute;
