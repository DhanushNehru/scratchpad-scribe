import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getToken } from "@/utils/auth";
import { handleAuthResponse } from "@/utils/authHelpers";

type User = {
    id: string;
    username?: string;
    email?: string;
};

type ContextType = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
    signup: (username: string, email: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
    logout: () => void;
    isLoggedIn: boolean;
    token: string | null;
};

const TOKEN_KEY = "notes_app_token";
const USER_KEY = "notes_app_user";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CurrentUserContext = createContext<ContextType | undefined>(undefined);

export const CurrentUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const token = getToken();
        if (token) {
            const userStr = localStorage.getItem(USER_KEY);
            if (userStr) {
                setUser(JSON.parse(userStr));
            }
        }
        setLoading(false);
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
        } catch (err: unknown) {
            if (err instanceof Error) {
                return { success: false, message: err.message };
            } else {
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
        } catch (err: unknown) {
            if (err instanceof Error) {
                return { success: false, message: err.message };
            } else {
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

    return (
        <CurrentUserContext.Provider
            value={{
                user,
                loading,
                login,
                signup,
                logout,
                isLoggedIn: !!user,
                token: getToken(),
            }}
        >
            {children}
        </CurrentUserContext.Provider>
    );
};

export const useCurrentUser = () => {
    const context = useContext(CurrentUserContext);
    if (!context) {
        throw new Error("useCurrentUser must be used within a CurrentUserProvider");
    }
    return context;
};
