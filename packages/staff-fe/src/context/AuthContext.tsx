import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Keycloak from 'keycloak-js';
import { setTokenProvider } from '../api/client';

interface AuthState {
  keycloak: Keycloak | null;
  authenticated: boolean;
  token: string | null;
  logout: () => void;
  userName: string | null;
  roles: string[];
  orgId: string | null;
  salonIds: string[];
  staffRole: string | null;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({
  keycloak: null,
  authenticated: false,
  token: null,
  logout: () => {},
  userName: null,
  roles: [],
  orgId: null,
  salonIds: [],
  staffRole: null,
  ready: false,
});

function extractClaims(keycloak: Keycloak) {
  const parsed = keycloak.tokenParsed as Record<string, unknown> | undefined;
  return {
    userName: parsed
      ? `${(parsed.given_name as string) || ''} ${(parsed.family_name as string) || ''}`.trim()
      : null,
    roles: [
      ...((parsed?.realm_access as { roles?: string[] })?.roles || []),
      ...((parsed?.resource_access as Record<string, { roles?: string[] }>)?.['kosm-api']?.roles || []),
    ],
    orgId: (parsed?.org_id as string) || null,
    salonIds: (parsed?.salon_ids as string[]) || [],
    staffRole: (parsed?.staff_role as string) || null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [keycloak] = useState(
    () =>
      new Keycloak({
        url: import.meta.env.VITE_KEYCLOAK_URL || 'https://auth.localhost',
        realm: import.meta.env.VITE_KEYCLOAK_REALM || 'kosm',
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'kosm-staff',
      }),
  );
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [claims, setClaims] = useState<ReturnType<typeof extractClaims>>({
    userName: null, roles: [], orgId: null, salonIds: [], staffRole: null,
  });
  const [ready, setReady] = useState(false);

  const syncToken = useCallback(() => {
    setToken(keycloak.token || null);
    setClaims(extractClaims(keycloak));
  }, [keycloak]);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required' })
      .then((auth) => {
        setAuthenticated(auth);
        setTokenProvider(() => keycloak.token || null);
        syncToken();
        setReady(true);
      });

    const interval = setInterval(() => {
      if (keycloak.authenticated) {
        keycloak.updateToken(60).then((refreshed) => {
          if (refreshed) syncToken();
        }).catch(() => {
          keycloak.logout();
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [keycloak, syncToken]);

  const logout = () => keycloak.logout();

  return (
    <AuthContext.Provider value={{
      keycloak, authenticated, token, logout, ready,
      userName: claims.userName,
      roles: claims.roles,
      orgId: claims.orgId,
      salonIds: claims.salonIds,
      staffRole: claims.staffRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
