import {
    createContext,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GMAIL_METADATA_SCOPE = 'https://www.googleapis.com/auth/gmail.metadata'

export interface AuthUser {
    email: string
}

interface AuthContextValue {
    user: AuthUser | null
    accessToken: string | null
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
    const [user, setUser] = useState<AuthUser | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMessage, setModalMessage] = useState('Connect Gmail to scan sender metadata in this tab only.')
    const [authError, setAuthError] = useState<string | null>(null)
    const [isAuthReady, setIsAuthReady] = useState(false)
    const [isAuthLoading, setIsAuthLoading] = useState(false)
    const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null)

    const handleAuthResponse = async (response: { access_token?: string; error?: string }) => {
        if (response.error || !response.access_token) {
            setAuthError(response.error || 'Google sign-in failed.')
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

    const openAuthModal = (message = 'Connect Gmail to scan sender metadata in this tab only.') => {
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

        tokenClientRef.current.requestAccessToken({ prompt: 'consent' })
    }

    const signOut = () => {
        if (accessToken && window.google?.accounts?.oauth2) {
            window.google.accounts.oauth2.revoke(accessToken, () => undefined)
        }

        setAccessToken(null)
        setUser(null)
    }

    const value = useMemo<AuthContextValue>(() => ({
        user,
        accessToken,
        isAuthenticated: Boolean(user && accessToken),
        isAuthReady,
        authError,
        modalOpen,
        modalMessage,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signOut,
    }), [accessToken, authError, isAuthReady, modalMessage, modalOpen, user])

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
                        <li>Read Gmail sender metadata during the current tab session</li>
                        <li>No email bodies, attachments, or contacts</li>
                        <li>No local persistence after refresh or close</li>
                    </ul>
                </div>
                <button className="google-auth-btn" onClick={signInWithGoogle} disabled={!isAuthReady}>
                    <span className="google-auth-mark">G</span>
                    <span>{isAuthReady ? 'Connect Gmail Metadata' : 'Loading Google Auth...'}</span>
                </button>
                {authError && <p className="auth-error">{authError}</p>}
            </div>
        </div>
    )
}
