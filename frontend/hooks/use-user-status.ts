"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { userService } from "@/lib/api";

interface UserStatus {
  isRegistered: boolean | null;
  hasCompletedOnboarding: boolean | null;
  loading: boolean;
  user: any | null;
}

export function useUserStatus(): UserStatus {
  const { user, authenticated } = useAuth();
  const [status, setStatus] = useState<UserStatus>({
    isRegistered: null,
    hasCompletedOnboarding: null,
    loading: true,
    user: null,
  });

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!authenticated || !user) {
        setStatus({
          isRegistered: null,
          hasCompletedOnboarding: null,
          loading: false,
          user: null,
        });
        return;
      }

      try {
        setStatus(prev => ({ ...prev, loading: true }));
        
        // Check user status via backend API
        const userData = await userService.getCurrentUser();
        
        setStatus({
          isRegistered: true,
          hasCompletedOnboarding: userData.hasCompletedOnboarding || false,
          loading: false,
          user: userData,
        });
      } catch (error) {
        console.error("Error checking user status:", error);
        
        // If user doesn't exist in backend (404 or similar), they need to register
        // But they are authenticated with Privy, so they can proceed to onboarding
        setStatus({
          isRegistered: false, // false means authenticated but not registered in backend
          hasCompletedOnboarding: false,
          loading: false,
          user: null,
        });
      }
    };

    checkUserStatus();
  }, [authenticated, user]);

  return status;
}
