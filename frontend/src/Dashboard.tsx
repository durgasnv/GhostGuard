import { useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import { aggregateEmlText, aggregateHeaderGroups, demoCandidates, type MessageHeader } from './scan'
import './landing.css'

interface ServiceInfo {
    service: string
    domain: string
    lastSeen: string
    accountType: string
    messageCount: number
    status: 'Active' | 'Dormant' | 'Ghost'
    breached: boolean
}

type ReviewDecision = 'still-use' | 'not-using' | 'unsure'
type FinalStatus = ServiceInfo['status']

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

function formatLastSeen(value: string) {
    const parsed = new Date(value)

    if (Number.isNaN(parsed.getTime())) {
        return value
    }

    return parsed.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

function deriveFinalStatus(service: ServiceInfo, decision?: ReviewDecision): FinalStatus {
    if (decision === 'still-use') {
        return 'Active'
    }

    if (decision === 'not-using') {
        return service.status === 'Active' ? 'Dormant' : 'Ghost'
    }

    return service.status
}

function Dashboard() {
    const navigate = useNavigate()
    const { accessToken, openAuthModal, signOut, user } = useAuth()
    const [services, setServices] = useState<ServiceInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [draft, setDraft] = useState<string | null>(null)
    const [showDraft, setShowDraft] = useState(false)
    const [requesterEmail, setRequesterEmail] = useState('')
    const [notice, setNotice] = useState<string | null>(null)
    const [reviewDecisions, setReviewDecisions] = useState<Record<string, ReviewDecision>>({})

    useEffect(() => {
        setRequesterEmail(user?.email ?? '')
    }, [user?.email])

    const resetScanState = () => {
        setReviewDecisions({})
    }

    const analyzeCandidates = async (domains: ReturnType<typeof demoCandidates>) => {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains }),
        })

        if (!response.ok) {
            throw new Error('Unable to analyze sanitized domains.')
        }

        const data = await response.json()
        setServices(data)
        resetScanState()
        setNotice(`Mapped ${data.length} service domains without sending raw inbox content to the backend.`)
    }

    const scanInbox = async () => {
        if (!accessToken) {
            openAuthModal('Connect Gmail before scanning. GhostGuard only requests sender metadata during this session.')
            return
        }

        setLoading(true)
        setNotice(null)
        try {
            const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&includeSpamTrash=false', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })

            if (!listResponse.ok) {
                throw new Error('Unable to load Gmail message list.')
            }

            const listData = await listResponse.json() as { messages?: Array<{ id: string }> }
            const messages = listData.messages ?? []

            if (!messages.length) {
                setServices([])
                resetScanState()
                setNotice('No recent Gmail messages were available to scan.')
                return
            }

            const headerGroups = await Promise.all(messages.map(async (message) => {
                const metadataResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Date`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })

                if (!metadataResponse.ok) {
                    throw new Error('Unable to read Gmail metadata for one or more messages.')
                }

                const metadata = await metadataResponse.json() as {
                    payload?: { headers?: MessageHeader[] }
                }

                return metadata.payload?.headers ?? []
            }))

            const candidates = aggregateHeaderGroups(headerGroups)

            if (!candidates.length) {
                setServices([])
                resetScanState()
                setNotice('The scan completed, but no external service domains were detected from sender metadata.')
                return
            }

            await analyzeCandidates(candidates)
        } catch (error) {
            console.error('Scan failed:', error)
            setNotice('Gmail scan failed. Use the sample mode or upload a `.eml` file while the integration is being tested.')
        } finally {
            setLoading(false)
        }
    }

    const loadDemoScan = async () => {
        setLoading(true)
        setNotice(null)
        try {
            await analyzeCandidates(demoCandidates())
        } catch (error) {
            console.error('Demo scan failed:', error)
            setNotice('Sample scan failed because the backend analysis endpoint is unavailable.')
        } finally {
            setLoading(false)
        }
    }

    const generateDraft = async (service: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/generate-deletion-draft`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service_name: service, requester_email: requesterEmail || undefined }),
            })
            const data = await response.json()
            setDraft(data.draft)
            setShowDraft(true)
        } catch (error) {
            console.error('Draft failed:', error)
            setDraft(`To: privacy@${service.toLowerCase()}.com\nSubject: Data Deletion Request\n\nPlease delete my account and associated personal data and confirm when the request is complete.\n\nAccount email: ${requesterEmail || '[Your Email]'}\n\nRegards,\n[Your Name]`)
            setShowDraft(true)
        }
    }

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setLoading(true)
        setNotice(null)
        try {
            const text = await file.text()
            const candidates = aggregateEmlText(text)

            if (!candidates.length) {
                setServices([])
                resetScanState()
                setNotice('No external domains could be extracted from that `.eml` header block.')
                return
            }

            await analyzeCandidates(candidates)
        } catch (error) {
            console.error('File processing failed:', error)
            setNotice('Failed to process that `.eml` file.')
        } finally {
            setLoading(false)
        }
    }

    const setReviewDecision = (serviceKey: string, decision: ReviewDecision) => {
        setReviewDecisions((current) => ({
            ...current,
            [serviceKey]: decision,
        }))
    }

    const getServiceKey = (service: ServiceInfo) => `${service.service}-${service.domain}`

    const getReviewLabel = (decision?: ReviewDecision) => {
        if (decision === 'still-use') {
            return 'User confirms ongoing use'
        }

        if (decision === 'not-using') {
            return 'User says this is no longer used'
        }

        if (decision === 'unsure') {
            return 'User is unsure, keeping inferred status'
        }

        return 'Awaiting user review'
    }

    const reviewedServices = services.map((service) => {
        const serviceKey = getServiceKey(service)
        const reviewDecision = reviewDecisions[serviceKey]
        const finalStatus = deriveFinalStatus(service, reviewDecision)

        return {
            ...service,
            serviceKey,
            reviewDecision,
            finalStatus,
        }
    })

    const summary = {
        total: reviewedServices.length,
        ghost: reviewedServices.filter((service) => service.finalStatus === 'Ghost').length,
        breached: reviewedServices.filter((service) => service.breached).length,
        reviewed: reviewedServices.filter((service) => Boolean(service.reviewDecision)).length,
    }

    return (
        <div className="landing-body dashboard-page">
            <header className="landing-header dashboard-header">
                <div className="logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round"></path>
                        <path d="M12 8v4" strokeLinecap="square"></path>
                        <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"></circle>
                    </svg>
                    GG
                </div>
                <div className="dashboard-user utility-text">
                    {user?.email ? `Connected Gmail: ${user.email}` : 'Session-only Gmail access'}
                </div>
                <div className="nav-right nav-text">
                    <button className="nav-link-btn" onClick={() => navigate('/')}>Landing</button>
                    <button
                        className="nav-link-btn"
                        onClick={() => {
                            signOut()
                            navigate('/')
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="container dashboard-main">
                <section className="dashboard-hero dark-section" style={{ margin: '0 -4vw', padding: '5vw 4vw 3vw' }}>
                    <div>
                        <div className="label">Control Surface</div>
                        <h1 className="display-text dashboard-title">Eradication<br /><span className="display-italic">Dashboard</span></h1>
                    </div>
                    <div className="dashboard-hero-copy">
                        <p className="intro-p">
                            Review sanitized service domains, run Gmail metadata scans, and generate draft deletion requests without storing mailbox data.
                        </p>
                        <p className="utility-text">GhostGuard reads `From` and `Date` headers in the browser, strips them down to domains, and sends only those summaries to the backend.</p>
                        <div className="dashboard-actions">
                            <label className="pill-btn pill-btn-outline dashboard-upload">
                                Upload .eml
                                <input type="file" className="hidden-input" accept=".eml" onChange={handleFileUpload} />
                            </label>
                            <button onClick={scanInbox} disabled={loading} className="pill-btn">
                                {loading ? 'Scanning...' : 'Scan Gmail'}
                            </button>
                            <button onClick={loadDemoScan} disabled={loading} className="pill-btn pill-btn-outline">
                                Load Sample
                            </button>
                        </div>
                        <label className="dashboard-field">
                            <span className="label">Requester Email for Drafts</span>
                            <input
                                className="dashboard-input"
                                type="email"
                                value={requesterEmail}
                                onChange={(event) => setRequesterEmail(event.target.value)}
                                placeholder="Optional address to include in deletion drafts"
                            />
                        </label>
                    </div>
                </section>

                <section className="dashboard-summary dark-section" style={{ margin: '0 -4vw 4vw', padding: '3vw 4vw 4vw' }}>
                    <div className="dashboard-stat">
                        <div className="utility-text">Total Services</div>
                        <div className="dashboard-stat-value">{summary.total}</div>
                    </div>
                    <div className="dashboard-stat">
                        <div className="utility-text">Ghost Accounts</div>
                        <div className="dashboard-stat-value">{summary.ghost}</div>
                    </div>
                    <div className="dashboard-stat">
                        <div className="utility-text">Data Breaches</div>
                        <div className="dashboard-stat-value dashboard-stat-risk">{summary.breached}</div>
                    </div>
                    <div className="dashboard-stat">
                        <div className="utility-text">User Reviewed</div>
                        <div className="dashboard-stat-value">{summary.reviewed}</div>
                    </div>
                </section>

                {notice && (
                    <section className="dashboard-notice utility-text">
                        {notice}
                    </section>
                )}

                <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div className="label">Exposure Ledger</div>
                        <div className="utility-text">Inbox signals are shown first, then refined with user confirmation to stabilize the final classification.</div>
                    </div>

                    {reviewedServices.length > 0 ? (
                        <div className="dashboard-table-wrap">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Type</th>
                                        <th>Signals</th>
                                        <th>Last Seen</th>
                                        <th>Signal Status</th>
                                        <th>User Review</th>
                                        <th>Final Status</th>
                                        <th>Security</th>
                                        <th className="table-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reviewedServices.map((service) => (
                                        <tr key={service.serviceKey}>
                                            <td>
                                                <div className="dashboard-service">{service.service}</div>
                                                <div className="utility-text">{service.domain}</div>
                                            </td>
                                            <td>{service.accountType}</td>
                                            <td>{service.messageCount}</td>
                                            <td>{formatLastSeen(service.lastSeen)}</td>
                                            <td>
                                                <span className={`dashboard-badge dashboard-badge-${service.status.toLowerCase()}`}>{service.status}</span>
                                            </td>
                                            <td>
                                                <div className="review-controls">
                                                    <button
                                                        className={`review-chip ${service.reviewDecision === 'still-use' ? 'review-chip-selected' : ''}`}
                                                        onClick={() => setReviewDecision(service.serviceKey, 'still-use')}
                                                    >
                                                        Still Use
                                                    </button>
                                                    <button
                                                        className={`review-chip ${service.reviewDecision === 'not-using' ? 'review-chip-selected' : ''}`}
                                                        onClick={() => setReviewDecision(service.serviceKey, 'not-using')}
                                                    >
                                                        Not Using
                                                    </button>
                                                    <button
                                                        className={`review-chip ${service.reviewDecision === 'unsure' ? 'review-chip-selected' : ''}`}
                                                        onClick={() => setReviewDecision(service.serviceKey, 'unsure')}
                                                    >
                                                        Unsure
                                                    </button>
                                                </div>
                                                <div className="utility-text review-caption">{getReviewLabel(service.reviewDecision)}</div>
                                            </td>
                                            <td>
                                                <span className={`dashboard-badge dashboard-badge-${service.finalStatus.toLowerCase()}`}>{service.finalStatus}</span>
                                            </td>
                                            <td>
                                                <span className={service.breached ? 'dashboard-risk dashboard-risk-critical' : 'dashboard-risk'}>
                                                    {service.breached ? 'Breached' : 'Secure'}
                                                </span>
                                            </td>
                                            <td className="table-right">
                                                <button className="table-action" onClick={() => generateDraft(service.service)}>
                                                    Draft Deletion
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="dashboard-empty">
                            <p className="intro-p">No services found yet.</p>
                            <p className="utility-text">Run a demo scan or upload an `.eml` file to build the exposure ledger.</p>
                        </div>
                    )}
                </section>
            </main>

            {showDraft && draft && (
                <div className="auth-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="draft-modal-title">
                    <div className="auth-modal draft-modal">
                        <button className="auth-close" onClick={() => setShowDraft(false)} aria-label="Close draft dialog">
                            x
                        </button>
                        <div className="label">Generated Output</div>
                        <h2 id="draft-modal-title" className="auth-title">Deletion Draft</h2>
                        <pre className="draft-content">{draft}</pre>
                        <div className="dashboard-actions">
                            <button
                                className="pill-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(draft)
                                    setNotice('Draft copied to clipboard.')
                                }}
                            >
                                Copy Draft
                            </button>
                            <button className="pill-btn pill-btn-outline" onClick={() => setShowDraft(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
