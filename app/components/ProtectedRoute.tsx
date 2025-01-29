import React, { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const { status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: router.asPath });
    }
  }, [status]);
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  return children;
};

export default ProtectedRoute;
