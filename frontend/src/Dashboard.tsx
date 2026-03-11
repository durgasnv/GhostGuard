import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import './landing.css'

interface ServiceInfo {
    service: string
    domain: string
    lastSeen: string
    accountType: string
    status: 'Active' | 'Dormant' | 'Ghost'
    breached: boolean
}

function Dashboard() {
    const navigate = useNavigate()
    const { signOut, user } = useAuth()
    const [services, setServices] = useState<ServiceInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [draft, setDraft] = useState<string | null>(null)
    const [showDraft, setShowDraft] = useState(false)

    const scanInbox = async () => {
        setLoading(true)
        try {
            const response = await fetch('http://localhost:8080/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ headers: ['From: support@netflix.com', 'From: info@dropbox.com'] }),
            })
            const data = await response.json()
            setServices(data)
        } catch (error) {
            console.error('Scan failed:', error)
            setServices([
                { service: 'Netflix', domain: 'netflix.com', lastSeen: '2024-03-01', accountType: 'Subscription', status: 'Active', breached: false },
                { service: 'Dropbox', domain: 'dropbox.com', lastSeen: '2022-01-15', accountType: 'Cloud Storage', status: 'Ghost', breached: true },
                { service: 'LinkedIn', domain: 'linkedin.com', lastSeen: '2023-05-10', accountType: 'Professional', status: 'Dormant', breached: true },
            ])
        } finally {
            setLoading(false)
        }
    }

    const generateDraft = async (service: string) => {
        try {
            const response = await fetch('http://localhost:8080/generate-deletion-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service_name: service, user_email: user?.email ?? 'user@example.com' }),
            })
            const data = await response.json()
            setDraft(data.draft)
            setShowDraft(true)
        } catch (error) {
            console.error('Draft failed:', error)
            setDraft(`To: privacy@${service.toLowerCase()}.com\nSubject: GDPR Data Deletion Request\n\nPlease delete my account and all associated personal data.\n\nRegards,\n${user?.name ?? 'GhostGuard User'}`)
            setShowDraft(true)
        }
    }

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setLoading(true)
        try {
            const text = await file.text()
            const headers = text.split('\n\n')[0].split('\n')

            const response = await fetch('http://localhost:8080/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ headers }),
            })
            const data = await response.json()
            setServices(data)
        } catch (error) {
            console.error('File processing failed:', error)
            alert('Failed to process .eml file')
        } finally {
            setLoading(false)
        }
    }

    const summary = {
        total: services.length,
        ghost: services.filter((service) => service.status === 'Ghost').length,
        breached: services.filter((service) => service.breached).length,
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
                    Signed in as {user?.email}
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
                <section className="dashboard-hero">
                    <div>
                        <div className="label">Control Surface</div>
                        <h1 className="display-text dashboard-title">Eradication<br /><span className="display-italic">Dashboard</span></h1>
                    </div>
                    <div className="dashboard-hero-copy">
                        <p className="intro-p">
                            Review exposed services, launch inbox scans, and generate deletion requests from the same monochrome command surface used by the landing page.
                        </p>
                        <div className="dashboard-actions">
                            <label className="pill-btn pill-btn-outline dashboard-upload">
                                Upload .eml
                                <input type="file" className="hidden-input" accept=".eml" onChange={handleFileUpload} />
                            </label>
                            <button onClick={scanInbox} disabled={loading} className="pill-btn">
                                {loading ? 'Scanning...' : 'Demo Scan'}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="dashboard-summary">
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
                </section>

                <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div className="label">Exposure Ledger</div>
                        <div className="utility-text">Service traces discovered through inbox and account metadata analysis.</div>
                    </div>

                    {services.length > 0 ? (
                        <div className="dashboard-table-wrap">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Type</th>
                                        <th>Last Seen</th>
                                        <th>Status</th>
                                        <th>Security</th>
                                        <th className="table-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map((service) => (
                                        <tr key={`${service.service}-${service.domain}`}>
                                            <td>
                                                <div className="dashboard-service">{service.service}</div>
                                                <div className="utility-text">{service.domain}</div>
                                            </td>
                                            <td>{service.accountType}</td>
                                            <td>{service.lastSeen}</td>
                                            <td>
                                                <span className={`dashboard-badge dashboard-badge-${service.status.toLowerCase()}`}>{service.status}</span>
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
                                    alert('Draft copied to clipboard.')
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
