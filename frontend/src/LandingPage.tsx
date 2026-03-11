import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import './landing.css'

function SecurityVisual({ variant }: { variant: string }) {
    const nodes = (
        <>
            <circle cx="48" cy="48" r="10" />
            <circle cx="148" cy="60" r="10" />
            <circle cx="112" cy="142" r="10" />
            <path d="M58 53 138 62M54 57l50 78M142 68l-24 66" />
        </>
    )

    const visuals: Record<string, ReactNode> = {
        signal: (
            <svg viewBox="0 0 220 220" className="security-art-svg" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="110" cy="110" r="72" />
                <circle cx="110" cy="110" r="44" />
                <path d="M110 22v24M198 110h-24M110 198v-24M22 110h24" />
                <path d="m164 56-17 17M56 56l17 17M164 164l-17-17M56 164l17-17" />
            </svg>
        ),
        network: (
            <svg viewBox="0 0 220 220" className="security-art-svg" fill="none" stroke="currentColor" strokeWidth="3">
                {nodes}
            </svg>
        ),
        shield: (
            <svg viewBox="0 0 220 220" className="security-art-svg" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M110 24 170 48v48c0 40-24 72-60 96-36-24-60-56-60-96V48l60-24Z" />
                <path d="m82 110 20 20 36-44" />
            </svg>
        ),
        vault: (
            <svg viewBox="0 0 220 220" className="security-art-svg" fill="none" stroke="currentColor" strokeWidth="3">
                <rect x="44" y="44" width="132" height="132" rx="16" />
                <circle cx="110" cy="110" r="32" />
                <path d="M110 78v64M78 110h64" />
            </svg>
        ),
        breach: (
            <svg viewBox="0 0 220 220" className="security-art-svg" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M110 22v52" />
                <path d="m128 74-36 50h28l-18 74 62-86h-30l18-38Z" />
            </svg>
        ),
        archive: (
            <svg viewBox="0 0 220 220" className="security-art-svg" fill="none" stroke="currentColor" strokeWidth="3">
                <rect x="36" y="60" width="148" height="108" rx="12" />
                <path d="M60 60V42h100v18M84 104h52M84 128h52" />
                <circle cx="70" cy="116" r="10" />
            </svg>
        ),
        proxy: (
            <svg viewBox="0 0 220 220" className="security-art-svg" fill="none" stroke="currentColor" strokeWidth="3">
                <rect x="56" y="44" width="108" height="132" rx="12" />
                <path d="M82 78h56M82 106h56M82 134h34" />
                <circle cx="146" cy="136" r="22" />
                <path d="m136 136 8 8 16-18" />
            </svg>
        ),
        monitoring: (
            <svg viewBox="0 0 220 220" className="security-art-svg" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M30 152c24-48 62-72 116-72 18 0 34 2 44 6" />
                <circle cx="154" cy="78" r="30" />
                <circle cx="154" cy="78" r="10" />
                <path d="m42 150 36-30 26 16 26-32 20 12" />
            </svg>
        ),
    }

    return <div className={`security-art security-art-${variant}`}>{visuals[variant]}</div>
}

export default function LandingPage() {
    const navigate = useNavigate()
    const { isAuthenticated, openAuthModal, user } = useAuth()
    const [expandedAccordion, setExpandedAccordion] = useState<number | null>(1)
    const [expandedProjectItem, setExpandedProjectItem] = useState<number | null>(0)
    const [pendingDashboardEntry, setPendingDashboardEntry] = useState(false)

    useEffect(() => {
        if (pendingDashboardEntry && isAuthenticated) {
            setPendingDashboardEntry(false)
            navigate('/dashboard')
        }
    }, [isAuthenticated, navigate, pendingDashboardEntry])

    const enterDashboard = () => {
        if (isAuthenticated) {
            navigate('/dashboard')
            return
        }

        setPendingDashboardEntry(true)
        openAuthModal('You need to sign in first before initiating a scan or accessing your eradication dashboard.')
    }

    const openSignIn = () => {
        if (isAuthenticated) {
            navigate('/dashboard')
            return
        }

        openAuthModal('Sign in with Google to access your GhostGuard control surface.')
    }

    const accordionItems = [
        {
            id: 0,
            num: '/01',
            title: 'Local Header Discovery',
            visual: 'network',
            content: {
                title: 'Scanning inbox metadata without reading message bodies',
                p1: 'GhostGuard pulls only sender and date headers from Gmail or uploaded `.eml` files, then extracts service domains in the browser before any analysis request is made.',
                p2: 'That keeps the raw mailbox content local while still surfacing which external services are most likely tied to the inbox.',
            },
        },
        {
            id: 1,
            num: '/02',
            title: 'Sanitized Risk Analysis',
            visual: 'shield',
            content: {
                title: 'Backend analysis without raw inbox data',
                p1: 'The backend receives only sanitized domain summaries, then classifies activity state, flags known breach domains, and prepares the dashboard view.',
                p2: 'This keeps the trust boundary explicit: service domains travel to the API, but personal inbox content does not.',
            },
        },
        {
            id: 2,
            num: '/03',
            title: 'Draft-First Removal',
            visual: 'monitoring',
            content: {
                title: 'Generate requests, keep the user in control',
                p1: 'For every flagged service, GhostGuard can generate deletion-request language that the user reviews manually before sending.',
                p2: 'The product remains draft-only in the MVP so there is no hidden messaging workflow acting on the user’s behalf.',
            },
        },
    ]

    const projectItems = [
        {
            title: 'Session-Only Scan',
            visual: 'vault',
            description: 'OAuth access is held in memory for the current tab and can be revoked immediately, keeping the MVP aligned with a zero-persistence posture.',
        },
        {
            title: 'Sample Inbox Mode',
            visual: 'shield',
            description: 'A sample scan path exists for demos and judging so the product can be shown without requiring a live Gmail account.',
        },
        {
            title: 'Breach Flags',
            visual: 'breach',
            description: 'Known breach markers let the dashboard highlight services that deserve faster attention once dormant accounts are identified.',
        },
        {
            title: 'Draft Composer',
            visual: 'proxy',
            description: 'Deletion requests are generated as editable drafts so the user remains the final sender and reviewer.',
        },
    ]

    return (
        <div className="landing-body">
            <header className="landing-header">
                <div className="logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round"></path>
                        <path d="M12 8v4" strokeLinecap="square"></path>
                        <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"></circle>
                    </svg>
                    GG
                </div>
                <nav className="nav-center nav-text">
                    <a href="#trust">Trust</a>
                    <a href="#architecture">Architecture</a>
                    <a href="#protocols">Protocols</a>
                    <a href="#intelligence">Modules</a>
                </nav>
                <div className="nav-right nav-text">
                    <button className="nav-link-btn" onClick={openSignIn}>{isAuthenticated ? user?.email ?? 'Dashboard' : 'Connect Gmail'}</button>
                    <button className="nav-link-btn" onClick={enterDashboard}>Audit Profile</button>
                </div>
            </header>

            <main className="container">
                <section className="hero">
                    <div className="hero-top">
                        <div className="hero-text-wrap">
                            <h1 className="display-text">Trace. Purge.<br /><span className="display-italic">Vanish.</span></h1>
                            <div className="hero-statement utility-text">
                                Inbox metadata in.<br />
                                exposed services out.
                            </div>
                        </div>
                    </div>

                    <div className="hero-image-container">
                        <SecurityVisual variant="signal" />
                    </div>

                    <div className="hero-meta">
                        <div className="utility-text" style={{ maxWidth: '440px' }}>
                            GhostGuard is a privacy-first MVP for identifying likely service accounts from Gmail sender metadata, highlighting breached domains, and drafting deletion requests without storing a user database.
                        </div>
                        <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--black)', borderRadius: '50%' }}></div>
                        <button className="pill-btn" onClick={enterDashboard}>Initiate Scan</button>
                    </div>
                </section>

                <section className="trust-strip section-pad" id="trust">
                    <div className="trust-card">
                        <div className="label">What We Access</div>
                        <p className="intro-p">Sender and date headers from Gmail metadata or uploaded `.eml` files.</p>
                    </div>
                    <div className="trust-card">
                        <div className="label">What We Do Not Read</div>
                        <p className="intro-p">Email bodies, attachments, and contact lists are outside the scan path.</p>
                    </div>
                    <div className="trust-card">
                        <div className="label">What We Store</div>
                        <p className="intro-p">Nothing by default. OAuth access and scan results live only in the active tab session.</p>
                    </div>
                    <div className="trust-card">
                        <div className="label">What Leaves The Browser</div>
                        <p className="intro-p">Only sanitized service-domain summaries needed for dashboard analysis and draft generation.</p>
                    </div>
                </section>

                <section className="section-pad">
                    <div className="threat-header">
                        <div className="threat-header-left title-sm">Typical<br />Findings</div>
                    </div>

                    <div className="threat-grid">
                        <div className="threat-card">
                            <div className="threat-img-box">
                                <SecurityVisual variant="archive" />
                            </div>
                            <div className="threat-meta">
                                <span className="threat-title">Dormant Subscriptions</span>
                                <span className="utility-text">Activity Drift</span>
                            </div>
                            <div className="utility-text" style={{ marginTop: '4px' }}>Services that still send account mail long after they stopped being useful.</div>
                        </div>

                        <div className="threat-card offset">
                            <div className="threat-img-box">
                                <SecurityVisual variant="breach" />
                            </div>
                            <div className="threat-meta">
                                <span className="threat-title">Breached Domains</span>
                                <span className="utility-text" style={{ color: '#d00000' }}>Priority Review</span>
                            </div>
                            <div className="utility-text" style={{ marginTop: '4px' }}>Known incident history helps rank which dormant services should be handled first.</div>
                        </div>

                        <div className="threat-card" style={{ marginTop: '8vw' }}>
                            <div className="threat-img-box">
                                <SecurityVisual variant="network" />
                            </div>
                            <div className="threat-meta">
                                <span className="threat-title">Long-Tail Accounts</span>
                                <span className="utility-text">Low Visibility</span>
                            </div>
                            <div className="utility-text" style={{ marginTop: '4px' }}>Older services often stay tied to an inbox long after the user stops thinking about them.</div>
                        </div>
                    </div>
                </section>

                <section className="intro-block" id="architecture">
                    <div className="label">The core philosophy</div>
                    <h2 className="intro-title">Absolute Control</h2>
                    <div style={{ gridColumn: '2' }}></div>
                    <div className="intro-text-wrapper">
                        <p className="intro-p">
                            GhostGuard is built around a narrow trust boundary: parse inbox metadata locally, sanitize aggressively, and only then ask the backend for enrichment.
                        </p>
                        <p className="utility-text">
                            The goal is not broad surveillance. The goal is to identify likely external services, estimate staleness, and move users toward reviewable deletion actions.
                        </p>
                    </div>
                </section>

                <section id="protocols">
                    <div className="accordion-list">
                        {accordionItems.map((item) => (
                            <div key={item.id} className={`accordion-item ${expandedAccordion === item.id ? 'expanded' : ''}`}>
                                <div className="accordion-header" onClick={() => setExpandedAccordion(expandedAccordion === item.id ? null : item.id)}>
                                    <span className="acc-num">{item.num}</span>
                                    <span className="acc-title">{item.title}</span>
                                    <span className="acc-icon">{expandedAccordion === item.id ? '-' : '+'}</span>
                                </div>
                                {expandedAccordion === item.id && (
                                    <div className="accordion-content">
                                        <div className="acc-content-img">
                                            <SecurityVisual variant={item.visual} />
                                        </div>
                                        <div className="acc-content-text">
                                            <h3 className="title-sm" style={{ marginBottom: '8px' }}>{item.content.title}</h3>
                                            <p>{item.content.p1}</p>
                                            <p>{item.content.p2}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="acc-action">
                        <button className="pill-btn pill-btn-outline" onClick={enterDashboard}>View Dashboard</button>
                    </div>
                </section>

                <section className="project-list-section" id="intelligence">
                    <div className="project-list-intro">
                        <div className="label">Project Modules</div>
                        <h2 className="intro-title">Operational Layers</h2>
                    </div>
                    <div className="accordion-list project-accordion">
                        {projectItems.map((item, index) => (
                            <div key={item.title} className={`accordion-item ${expandedProjectItem === index ? 'expanded' : ''}`}>
                                <div className="accordion-header" onClick={() => setExpandedProjectItem(expandedProjectItem === index ? null : index)}>
                                    <span className="acc-num">/{String(index + 1).padStart(2, '0')}</span>
                                    <span className="acc-title">{item.title}</span>
                                    <span className="acc-icon">{expandedProjectItem === index ? '-' : '+'}</span>
                                </div>
                                {expandedProjectItem === index && (
                                    <div className="accordion-content project-content">
                                        <div className="acc-content-img">
                                            <SecurityVisual variant={item.visual} />
                                        </div>
                                        <div className="acc-content-text">
                                            <p>{item.description}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}
