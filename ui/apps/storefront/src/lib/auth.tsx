import * as React from "react";
import * as jose from "jose";

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: "customer" | "admin";
  emailVerified: boolean;
  createdAt: string;
}

interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const SESSION_STORAGE_KEY = "session";
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// JWT decoding helper (client-side only for inspection)
function decodeToken(token: string): { exp?: number; sub?: string } | null {
  try {
    const payload = jose.decodeJwt(token);
    return payload as { exp?: number; sub?: string };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return Date.now() >= (decoded.exp - bufferSeconds) * 1000;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const sessionRef = React.useRef<Session | null>(null);

  const saveSession = React.useCallback((session: Session | null) => {
    sessionRef.current = session;
    if (session) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const loadSession = React.useCallback((): Session | null => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return null;
      const session = JSON.parse(stored) as Session;
      sessionRef.current = session;
      return session;
    } catch {
      return null;
    }
  }, []);

  const refreshSession = React.useCallback(async () => {
    const session = sessionRef.current;
    if (!session?.refreshToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Refresh failed");
      }

      const data = await response.json();
      const newSession: Session = {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      };
      saveSession(newSession);
      setUser(newSession.user);
    } catch {
      saveSession(null);
      setUser(null);
    }
  }, [saveSession]);

  // Initialize auth state
  React.useEffect(() => {
    const session = loadSession();
    if (session) {
      if (isTokenExpired(session.accessToken)) {
        refreshSession().finally(() => setIsLoading(false));
      } else {
        setUser(session.user);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [loadSession, refreshSession]);

  // Set up token refresh interval
  React.useEffect(() => {
    const interval = setInterval(() => {
      const session = sessionRef.current;
      if (session && isTokenExpired(session.accessToken, 300)) {
        refreshSession();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [refreshSession]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          return { success: false, error: error.message || "Login failed" };
        }

        const data = await response.json();
        const session: Session = {
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        };
        saveSession(session);
        setUser(session.user);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Login failed",
        };
      }
    },
    [saveSession]
  );

  const loginWithMagicLink = React.useCallback(async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/magic-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || "Failed to send magic link" };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to send magic link",
      };
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors, still clear local state
    }
    saveSession(null);
    setUser(null);
  }, [saveSession]);

  const register = React.useCallback(
    async (data: RegisterData) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          return { success: false, error: error.message || "Registration failed" };
        }

        const result = await response.json();
        const session: Session = {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
        };
        saveSession(session);
        setUser(session.user);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Registration failed",
        };
      }
    },
    [saveSession]
  );

  const value = React.useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginWithMagicLink,
      logout,
      register,
      refreshSession,
    }),
    [user, isLoading, login, loginWithMagicLink, logout, register, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    // Return default implementation if provider not available
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({ success: false, error: "Auth not initialized" }),
      loginWithMagicLink: async () => ({ success: false, error: "Auth not initialized" }),
      logout: async () => {},
      register: async () => ({ success: false, error: "Auth not initialized" }),
      refreshSession: async () => {},
    };
  }
  return context;
}

// Utility function for authenticated API calls
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) {
    throw new Error("Not authenticated");
  }

  const session = JSON.parse(stored) as Session;
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

export type { Session };
