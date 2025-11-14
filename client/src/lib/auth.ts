/**
 * Authentication utilities
 */

export function getLoginUrl(): string {
  const portalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // If OAuth is not configured, return a placeholder URL
  if (!portalUrl || !appId) {
    return "#";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  return `${portalUrl}/login?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function getLogoutUrl(): string {
  return `${window.location.origin}/api/auth/logout`;
}
