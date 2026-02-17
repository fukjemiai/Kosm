import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Keycloak from 'keycloak-js';
import { setTokenProvider } from '../api/client';

interface AuthState {
  keycloak: Keycloak | null;
  authenticated: boolean;
  token: string | null;
  logout: () => void;
  userName: string | null;
  roles: string[];
  ready: boolean;
}

const AuthContext = createContext<AuthState>({
  keycloak: null,
  authenticated: false,
  token: null,
  logout: () => {},
  userName: null,
  roles: [],
  ready: false,
});

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required' })
      .then((auth) => {
        setAuthenticated(auth);
        setToken(keycloak.token || null);
        setTokenProvider(() => keycloak.token || null);
        setReady(true);
      });

    const interval = setInterval(() => {
      if (keycloak.authenticated) {
        keycloak.updateToken(30).then((refreshed) => {
          if (refreshed) setToken(keycloak.token || null);
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [keycloak]);

  const logout = () => keycloak.logout();
  const userName = keycloak.tokenParsed
    ? `${keycloak.tokenParsed.given_name || ''} ${keycloak.tokenParsed.family_name || ''}`.trim()
    : null;
  const roles = [
    ...(keycloak.tokenParsed?.realm_access?.roles || []),
    ...(keycloak.tokenParsed?.resource_access?.['kosm-api']?.roles || []),
  ];

  return (
    <AuthContext.Provider value={{ keycloak, authenticated, token, logout, userName, roles, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
