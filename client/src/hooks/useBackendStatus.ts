/**
 * Hook to monitor backend connection status
 */

import { useState, useEffect } from "react";
import { apiService } from "@/lib/api";

export interface BackendStatus {
  isHealthy: boolean;
  isChecking: boolean;
  error?: string;
}

export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>({
    isHealthy: false,
    isChecking: true,
  });

  useEffect(() => {
    let isMounted = true;
    let checkInterval: NodeJS.Timeout;

    const checkHealth = async () => {
      try {
        const isHealthy = await apiService.checkHealth();
        if (isMounted) {
          setStatus({
            isHealthy,
            isChecking: false,
            error: isHealthy ? undefined : "Backend server is not responding",
          });
        }
      } catch (error) {
        if (isMounted) {
          setStatus({
            isHealthy: false,
            isChecking: false,
            error: "Failed to connect to backend",
          });
        }
      }
    };

    // Initial check
    checkHealth();

    // Check every 10 seconds
    checkInterval = setInterval(checkHealth, 10000);

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
    };
  }, []);

  return status;
}
