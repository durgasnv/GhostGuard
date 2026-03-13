import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GMAIL_METADATA_SCOPE = 'https://www.googleapis.com/auth/gmail.modify'
const AUTH_SESSION_KEY = 'ghostguard.auth.session'

export interface AuthUser {
    email: string
}

interface AuthContextValue {
    user: AuthUser | null
    accessToken: string | null
    grantedScopes: string[]
    hasGmailModifyScope: boolean
    isAuthenticated: boolean
    isAuthReady: boolean
    authError: string | null
    modalOpen: boolean
    modalMessage: string
    openAuthModal: (message?: string) => void
    closeAuthModal: () => void
    signInWithGoogle: () => void
    signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const stored = sessionStorage.getItem(AUTH_SESSION_KEY)
        if (!stored) {
            return null
        }

        try {
            const parsed = JSON.parse(stored) as { user?: AuthUser }
            return parsed.user ?? null
        } catch {
            return null
        }
    })
    const [accessToken, setAccessToken] = useState<string | null>(() => {
        const stored = sessionStorage.getItem(AUTH_SESSION_KEY)
        if (!stored) {
            return null
        }

        try {
            const parsed = JSON.parse(stored) as { accessToken?: string }
            return parsed.accessToken ?? null
        } catch {
            return null
        }
    })
    const [grantedScopes, setGrantedScopes] = useState<string[]>(() => {
        const stored = sessionStorage.getItem(AUTH_SESSION_KEY)
        if (!stored) {
            return []
        }

        try {
            const parsed = JSON.parse(stored) as { grantedScopes?: string[] }
            return parsed.grantedScopes ?? []
        } catch {
            return []
        }
    })
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMessage, setModalMessage] = useState('Connect Gmail to scan service emails and optionally delete selected inbox messages in this tab only.')
    const [authError, setAuthError] = useState<string | null>(null)
    const [isAuthReady, setIsAuthReady] = useState(false)
    const [isAuthLoading, setIsAuthLoading] = useState(false)
    const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null)

    useEffect(() => {
        if (!accessToken || !user) {
            sessionStorage.removeItem(AUTH_SESSION_KEY)
            return
        }

        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
            accessToken,
            grantedScopes,
            user,
        }))
    }, [accessToken, grantedScopes, user])

    const handleAuthResponse = async (response: { access_token?: string; error?: string; scope?: string }) => {
        if (response.error || !response.access_token) {
            setAuthError(response.error || 'Google sign-in failed.')
            return
        }

        const nextScopes = (response.scope ?? '')
            .split(' ')
            .map((scope) => scope.trim())
            .filter(Boolean)

        if (!nextScopes.includes(GMAIL_METADATA_SCOPE)) {
            setAccessToken(null)
            setUser(null)
            setGrantedScopes(nextScopes)
            setAuthError('Google sign-in succeeded, but Gmail cleanup access was not granted. Remove GhostGuard from your Google permissions and reconnect.')
            return
        }

        try {
            const profileResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                headers: {
                    Authorization: `Bearer ${response.access_token}`,
                },
            })

            if (!profileResponse.ok) {
                throw new Error('Unable to retrieve Gmail profile.')
            }

            const profile = await profileResponse.json()
            const nextUser: AuthUser = {
                email: profile.emailAddress ?? 'Connected Gmail session',
            }

            setAccessToken(response.access_token)
            setGrantedScopes(nextScopes)
            setUser(nextUser)
            setAuthError(null)
            setModalOpen(false)
        } catch (error) {
            console.error(error)
            setAuthError('Google access completed, but the mailbox profile lookup failed.')
        }
    }

    const initializeGoogleClient = () => {
        if (!window.google?.accounts?.oauth2 || !GOOGLE_CLIENT_ID) {
            setIsAuthReady(true)
            setIsAuthLoading(false)
            return
        }

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GMAIL_METADATA_SCOPE,
            callback: handleAuthResponse,
        })

        setIsAuthReady(true)
        setIsAuthLoading(false)
    }

    const ensureGoogleClient = () => {
        if (tokenClientRef.current || isAuthLoading) {
            return
        }

        if (!GOOGLE_CLIENT_ID) {
            setIsAuthReady(true)
            return
        }

        if (window.google?.accounts?.oauth2) {
            initializeGoogleClient()
            return
        }

        setIsAuthLoading(true)
        const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-gsi="true"]')
        const onLoad = () => initializeGoogleClient()

        if (existingScript) {
            existingScript.addEventListener('load', onLoad, { once: true })
            return
        }

        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.dataset.googleGsi = 'true'
        script.addEventListener('load', onLoad, { once: true })
        document.head.appendChild(script)
    }

    const openAuthModal = (message = 'Connect Gmail to scan service emails and optionally delete selected inbox messages in this tab only.') => {
        setModalMessage(message)
        setAuthError(null)
        setModalOpen(true)
        ensureGoogleClient()
    }

    const closeAuthModal = () => {
        setModalOpen(false)
    }

    const signInWithGoogle = () => {
        if (!GOOGLE_CLIENT_ID) {
            setAuthError('Google auth is not configured. Set VITE_GOOGLE_CLIENT_ID in the frontend environment.')
            return
        }

        if (!tokenClientRef.current) {
            ensureGoogleClient()
            setAuthError('Google auth is still loading. Try again in a moment.')
            return
        }

        tokenClientRef.current.requestAccessToken({
            prompt: 'consent',
            scope: GMAIL_METADATA_SCOPE,
            include_granted_scopes: false,
        })
    }

    const signOut = () => {
        if (accessToken && window.google?.accounts?.oauth2) {
            window.google.accounts.oauth2.revoke(accessToken, () => undefined)
        }

        setAccessToken(null)
        setGrantedScopes([])
        setUser(null)
    }

    const hasGmailModifyScope = grantedScopes.includes(GMAIL_METADATA_SCOPE)

    const value = useMemo<AuthContextValue>(() => ({
        user,
        accessToken,
        grantedScopes,
        hasGmailModifyScope,
        isAuthenticated: Boolean(user && accessToken && hasGmailModifyScope),
        isAuthReady,
        authError,
        modalOpen,
        modalMessage,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signOut,
    }), [accessToken, authError, grantedScopes, hasGmailModifyScope, isAuthReady, modalMessage, modalOpen, user])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }

    return context
}

export function AuthModal() {
    const { authError, closeAuthModal, isAuthReady, modalMessage, modalOpen, signInWithGoogle } = useAuth()

    if (!modalOpen) {
        return null
    }

    return (
        <div className="auth-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <div className="auth-modal">
                <button className="auth-close" onClick={closeAuthModal} aria-label="Close sign-in dialog">
                    x
                </button>
                <div className="label">Authentication Required</div>
                <h2 id="auth-modal-title" className="auth-title">Secure Access Only</h2>
                <p className="auth-copy">{modalMessage}</p>
                <div className="auth-permissions">
                    <div className="label">Permissions Requested</div>
                    <ul className="auth-permission-list">
                        <li>Read Gmail messages and move selected ones to Trash in this session</li>
                        <li>Read subjects, snippets, and dates for service-related inbox cleanup</li>
                        <li>Session-only persistence for this tab; data clears when the tab session ends</li>
                    </ul>
                </div>
                <p className="utility-text">Required Google scope: `https://www.googleapis.com/auth/gmail.modify`</p>
                <button className="google-auth-btn" onClick={signInWithGoogle} disabled={!isAuthReady}>
                    <span className="google-auth-mark">G</span>
                    <span>{isAuthReady ? 'Connect Gmail Cleanup Access' : 'Loading Google Auth...'}</span>
                </button>
                {authError && <p className="auth-error">{authError}</p>}
            </div>
        </div>
    )
}
