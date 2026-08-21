export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  verified_email?: boolean;
}

// Global script loader for Google Identity Services
export function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-identity-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google script')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Triggers official Google OAuth2 Account Selector Popup
 * Opens Google's account choice screen where the user selects their account
 */
export async function triggerGoogleOAuth(
  clientId?: string
): Promise<GoogleUserProfile> {
  await loadGoogleIdentityScript();

  // Prefer environment variable or passed client ID or demo client ID
  const effectiveClientId =
    clientId ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1084239857421-mockgoogleoauth2docuflowai.apps.googleusercontent.com';

  return new Promise((resolve, reject) => {
    try {
      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        throw new Error('Google Identity Services not available');
      }

      const client = google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          try {
            // Fetch real user info from Google's UserInfo endpoint
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!res.ok) {
              throw new Error('Failed to retrieve user profile from Google');
            }

            const profile = await res.json();
            resolve({
              id: profile.sub || `google_${Date.now()}`,
              name: profile.name || profile.given_name || 'Google User',
              email: profile.email,
              avatar:
                profile.picture ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || profile.email)}`,
              verified_email: profile.email_verified,
            });
          } catch (fetchErr) {
            reject(fetchErr);
          }
        },
        error_callback: (err: any) => {
          reject(err);
        },
      });

      // Explicitly prompt account selection popup
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
}
