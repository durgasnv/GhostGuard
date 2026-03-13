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
            image: '/Session_only_Scan.png',
            description: 'OAuth access is held in memory for the current tab and can be revoked immediately, keeping the MVP aligned with a zero-persistence posture.',
        },
        {
            title: 'Sample Inbox Mode',
            image: '/Sample_Inbox_Mode.png',
            description: 'A sample scan path exists for demos and judging so the product can be shown without requiring a live Gmail account.',
        },
        {
            title: 'Breach Flags',
            image: '/Breach_Flags.png',
            description: 'Known breach markers let the dashboard highlight services that deserve faster attention once dormant accounts are identified.',
        },
        {
            title: 'Draft Composer',
            image: '/Draft_Composer.png',
            description: 'Deletion requests are generated as editable drafts so the user remains the final sender and reviewer.',
        },
    ]

    return (
        <div className="landing-body">
            <header className="landing-header">
                <div className="logo" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}>
                    <img 
                        src="/ghost_security.png" 
                        alt="Ghost Guard" 
                        style={{ height: '24px', width: 'auto', objectFit: 'contain' }} 
                    />
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
                                <h1 className="display-text hero-title">
                                    <span className="display-italic">Trace.</span>{' '}
                                    <span className="display-italic">Purge.</span>
                                    <br />
                                    <span className="display-italic">Vanish.</span>
                                </h1>
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
                                <img src="/Long_Tail.png" alt="Long-Tail Accounts" />
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
                    <div style={{ gridColumn: '1 / -1', marginBottom: '0.5vw' }}>
                        <h1 className="intro-title" style={{ textTransform: 'uppercase', marginBottom: '8px' }}>Absolute Control</h1>
                        <div className="label">The Core Philosophy</div>
                    </div>
                    
                    <div className="intro-image-wrapper" style={{ gridColumn: 1, width: '100%', maxWidth: '800px', overflow: 'hidden' }}>
                        <img 
                            src="/Absolute_Control.png" 
                            alt="Absolute Control" 
                            style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }} 
                        />
                    </div>

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

            <footer style={{ padding: '2vw 4vw', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <a 
                    href="https://github.com/durgasnv/GhostGuard" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ fontSize: '11px', color: 'var(--gray-text)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Check our repo &lt;3!
                </a>
            </footer>
        </div>
    )
}
