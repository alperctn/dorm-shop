"use client";

import { createContext, useContext, ReactNode } from "react";

// Basit bir mock context, çünkü gerçek auth artık sunucu tarafında (middleware) ve cookie ile yapılıyor.
// Firebase Auth SDK'sını tamamen kaldırdık çünkü npm sorunları yaratıyordu.

interface AuthContextType {
    user: any;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: false });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    return (
        <AuthContext.Provider value={{ user: null, loading: false }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
