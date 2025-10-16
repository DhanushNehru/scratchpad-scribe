import { useState, useEffect, useCallback } from "react";
import { getToken } from "@/utils/auth";
import { handleAuthResponse } from "@/utils/authHelpers";

type User = {
  id: string;
  username?: string;
  email: string;
};

const TOKEN_KEY = "notes_app_token";
const USER_KEY = "notes_app_user";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // authFetch helper for other hooks/components to call backend with token
  const authFetch = useCallback(
    async (input: RequestInfo, init: RequestInit = {}) => {
      const token = getToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const resp = await fetch(input, { ...init, headers });
      return resp;
    },
    []
  );

  // Validate token on mount and fetch user
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch (err) {
        console.error("Session check failed", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Login failed");
      }

      const data = await res.json();
      return handleAuthResponse(data, setUser, TOKEN_KEY, USER_KEY);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Login error:", error);
        return { success: false, message: error.message };
      } else {
        console.error("Login error:", error);
        return { success: false, message: "Login failed" };
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Signup failed");
      }

      const data = await res.json();
      return handleAuthResponse(data, setUser, TOKEN_KEY, USER_KEY);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Signup error:", error);
        return { success: false, message: error.message };
      } else {
        console.error("Signup error:", error);
        return { success: false, message: "Signup failed" };
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
    isLoggedIn: !!user,
    authFetch,
    token: getToken(),
  };
}
