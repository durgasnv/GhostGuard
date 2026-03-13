/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID?: string
    readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare global {
    interface Window {
        google?: {
            accounts?: {
                oauth2?: {
                    initTokenClient: (config: {
                        client_id: string
                        scope: string
                        callback: (response: { access_token?: string; error?: string; scope?: string }) => void
                    }) => google.accounts.oauth2.TokenClient
                    revoke: (token: string, callback?: () => void) => void
                }
            }
        }
    }

    namespace google.accounts.oauth2 {
        interface TokenClient {
            requestAccessToken: (options?: { prompt?: string; scope?: string; include_granted_scopes?: boolean }) => void
        }
    }
}

export {}
