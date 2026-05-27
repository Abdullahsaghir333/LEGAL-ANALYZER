"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RoleGuard({ children, allowedRoles }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    if (!userInfo || !userInfo.role) {
      router.push("/login");
      return;
    }

    if (!allowedRoles.includes(userInfo.role)) {
      // Redirect based on what role they actually have
      if (userInfo.role === "lawyer" || userInfo.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/client/dashboard");
      }
      return;
    }

    setIsAuthorized(true);
  }, [router, allowedRoles]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin-slow rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
