import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Keycloak from 'keycloak-js';

interface AuthState {
  keycloak: Keycloak | null;
  authenticated: boolean;
  token: string | null;
  login: () => void;
  logout: () => void;
  userName: string | null;
}

const AuthContext = createContext<AuthState>({
  keycloak: null,
  authenticated: false,
  token: null,
  login: () => {},
  logout: () => {},
  userName: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [keycloak] = useState(
    () =>
      new Keycloak({
        url: import.meta.env.VITE_KEYCLOAK_URL || 'https://auth.localhost',
        realm: import.meta.env.VITE_KEYCLOAK_REALM || 'kosm',
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'kosm-customer',
      }),
  );
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'check-sso', silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html' })
      .then((auth) => {
        setAuthenticated(auth);
        setToken(keycloak.token || null);
      })
      .catch(() => {
        // Guest mode – no authentication required
        setAuthenticated(false);
      });

    // Token refresh
    const interval = setInterval(() => {
      if (keycloak.authenticated) {
        keycloak.updateToken(30).then((refreshed) => {
          if (refreshed) setToken(keycloak.token || null);
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [keycloak]);

  const login = () => keycloak.login();
  const logout = () => keycloak.logout();
  const userName = keycloak.tokenParsed
    ? `${keycloak.tokenParsed.given_name || ''} ${keycloak.tokenParsed.family_name || ''}`.trim()
    : null;

  return (
    <AuthContext.Provider value={{ keycloak, authenticated, token, login, logout, userName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
