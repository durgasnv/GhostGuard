import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import './landing.css'

export default function LandingPage() {
    const navigate = useNavigate()
    const { isAuthenticated, openAuthModal, user } = useAuth()
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
            return
        }

        openAuthModal('Sign in with Google to access your GhostGuard control surface.')
    }

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
                    <img src="/ghost-image.jpeg" alt="Ghost Guard Logo" />
                    GHOST GUARD
                </div>
                <nav className="nav-center nav-text">
                    <a href="#trust">Trust</a>
                    <a href="#architecture">Architecture</a>
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
                        <p className="intro-p">Sender and date headers from Gmail metadata.</p>
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

            <footer className="landing-footer">
                <a href="https://github.com/durgasnv/GhostGuard" target="_blank" rel="noopener noreferrer" className="github-link">
                    Check our repo &lt;3!
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                </a>
            </footer>
        </div>
    )
}
