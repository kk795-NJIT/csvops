import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Types
export interface User {
    id: number
    email: string
    name: string | null
    plan: 'free' | 'pro' | 'team'
    created_at: string
    updated_at: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, name?: string) => Promise<void>
    devLogin: () => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'ops_csv_cleaner_token'
const USER_KEY = 'ops_csv_cleaner_user'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem(USER_KEY)
        return stored ? JSON.parse(stored) : null
    })
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem(TOKEN_KEY)
    })
    const [isLoading, setIsLoading] = useState(false)

    // Verify token on mount
    useEffect(() => {
        if (token) {
            verifyToken()
        }
    }, [])

    const verifyToken = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                // Token invalid, clear auth
                logout()
            }
        } catch {
            // API not available, keep token for now
        }
    }

    const login = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || 'Login failed')
            }

            const data = await response.json()
            setToken(data.access_token)
            setUser(data.user)
            localStorage.setItem(TOKEN_KEY, data.access_token)
            localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (email: string, password: string, name?: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || 'Registration failed')
            }

            const data = await response.json()
            setToken(data.access_token)
            setUser(data.user)
            localStorage.setItem(TOKEN_KEY, data.access_token)
            localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        } finally {
            setIsLoading(false)
        }
    }

    const devLogin = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/auth/dev-login`, {
                method: 'POST',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || 'Dev login failed')
            }

            const data = await response.json()
            setToken(data.access_token)
            setUser(data.user)
            localStorage.setItem(TOKEN_KEY, data.access_token)
            localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!token && !!user,
                login,
                register,
                devLogin,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// Hook to get auth headers for API calls
export function useAuthHeaders(): HeadersInit {
    const { token } = useAuth()
    return token ? { 'Authorization': `Bearer ${token}` } : {}
}
