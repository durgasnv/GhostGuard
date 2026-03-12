
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import './landing.css'

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
            image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600',
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
            image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600',
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
            image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
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
            image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=600',
            description: 'OAuth access is held in memory for the current tab and can be revoked immediately, keeping the MVP aligned with a zero-persistence posture.',
        },
        {
            title: 'Sample Inbox Mode',
            image: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?auto=format&fit=crop&q=80&w=600',
            description: 'A sample scan path exists for demos and judging so the product can be shown without requiring a live Gmail account.',
        },
        {
            title: 'Breach Flags',
            image: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&q=80&w=600',
            description: 'Known breach markers let the dashboard highlight services that deserve faster attention once dormant accounts are identified.',
        },
        {
            title: 'Draft Composer',
            image: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=600',
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
                    <div className="hero-black-top">
                        <div className="hero-top">
                            <div className="hero-text-wrap">
                                <h1 className="display-text">Trace. Purge.<br /><span className="display-italic">Vanish.</span></h1>
                                <div className="hero-statement utility-text">
                                    Inbox metadata in.<br />
                                    exposed services out.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-image-container" style={{ borderTop: 'none' }}>
                        <img
                            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600"
                            alt="Cybersecurity terminal"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
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

                <section className="section-pad dark-section" style={{ margin: '0 -4vw', padding: '8vw 4vw' }}>
                    <div className="threat-header">
                        <div className="threat-header-left title-sm">Typical<br />Findings</div>
                    </div>

                    <div className="threat-grid">
                        <div className="threat-card">
                            <div className="threat-img-box">
                                <img src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=800" alt="Dormant data" />
                            </div>
                            <div className="threat-meta">
                                <span className="threat-title">Dormant Subscriptions</span>
                                <span className="utility-text">Activity Drift</span>
                            </div>
                            <div className="utility-text" style={{ marginTop: '4px' }}>Services that still send account mail long after they stopped being useful.</div>
                        </div>

                        <div className="threat-card offset">
                            <div className="threat-img-box">
                                <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800" alt="Breach alert" />
                            </div>
                            <div className="threat-meta">
                                <span className="threat-title">Breached Domains</span>
                                <span className="utility-text" style={{ color: '#ff4d4d' }}>Priority Review</span>
                            </div>
                            <div className="utility-text" style={{ marginTop: '4px' }}>Known incident history helps rank which dormant services should be handled first.</div>
                        </div>

                        <div className="threat-card" style={{ marginTop: '8vw' }}>
                            <div className="threat-img-box">
                                <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" alt="Server network" />
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
                    <h1 className="intro-title">Absolute Control</h1>
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
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                            />
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

                <section className="project-list-section dark-section" id="intelligence" style={{ margin: '0 -4vw', padding: '4vw 4vw 8vw' }}>
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
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                            />
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
