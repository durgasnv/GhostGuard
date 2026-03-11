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
            title: 'Deep Web Footprint Scan',
            visual: 'network',
            content: {
                title: 'Mapping hidden identity fragments',
                p1: 'GhostGuard correlates dormant signups, broker records, leaked credentials, and public traces into a single exposure graph so hidden accounts stop staying hidden.',
                p2: 'The scan surfaces where your name, inbox, phone number, and recovery aliases still appear, then ranks those records by risk and removability.',
            },
        },
        {
            id: 1,
            num: '/02',
            title: 'Automated Eradication Protocol',
            visual: 'shield',
            content: {
                title: 'Turning discovery into removal',
                p1: 'Each hit feeds into a structured takedown workflow built around privacy rights, service-specific deletion paths, and pre-generated request drafts.',
                p2: 'Instead of leaving you with a threat list, GhostGuard converts those findings into concrete deletion actions that can be tracked from request to confirmation.',
            },
        },
        {
            id: 2,
            num: '/03',
            title: 'Zero-Knowledge Continuous Monitoring',
            visual: 'monitoring',
            content: {
                title: 'Quiet monitoring, immediate alerts',
                p1: 'Once the initial sweep is complete, GhostGuard watches for new exposure signals without turning your workspace into another data sink.',
                p2: 'That gives users a live early-warning layer for resurfaced credentials, reactivated accounts, and fresh broker visibility.',
            },
        },
    ]

    const projectItems = [
        {
            title: 'Personal Vault',
            visual: 'vault',
            description: 'A privacy command center for individuals. Store exposure findings, review deletion drafts, and monitor which services still retain your personal data.',
        },
        {
            title: 'Enterprise Shield',
            visual: 'shield',
            description: 'A team-facing layer for employee exposure reduction, stale SaaS account cleanup, and coordinated removal workflows across distributed organizations.',
        },
        {
            title: 'Threat Intelligence',
            visual: 'breach',
            description: 'A prioritized signal feed that highlights breached domains, repeat exposure patterns, and accounts that create the highest downstream privacy risk.',
        },
        {
            title: 'Legal Proxies',
            visual: 'proxy',
            description: 'A request engine that turns scan results into formal deletion language so takedown and right-to-erasure actions are faster to issue and easier to document.',
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
                    <a href="#architecture">Architecture</a>
                    <a href="#protocols">Protocols</a>
                    <a href="#intelligence">Intelligence</a>
                    <a href="#enterprise">Enterprise</a>
                </nav>
                <div className="nav-right nav-text">
                    <button className="nav-link-btn" onClick={openSignIn}>{isAuthenticated ? user?.name ?? 'Dashboard' : 'Sign In'}</button>
                    <button className="nav-link-btn" onClick={enterDashboard}>Audit Profile</button>
                </div>
            </header>

            <main className="container">
                <section className="hero">
                    <div className="hero-top">
                        <div className="hero-text-wrap">
                            <h1 className="display-text">Trace. Purge.<br /><span className="display-italic">Vanish.</span></h1>
                            <div className="hero-statement utility-text">
                                The definitive protocol for<br />
                                eliminating digital shadows.
                            </div>
                        </div>
                    </div>

                    <div className="hero-image-container">
                        <SecurityVisual variant="signal" />
                    </div>

                    <div className="hero-meta">
                        <div className="utility-text" style={{ maxWidth: '440px' }}>
                            Since 2024, GhostGuard has been executing <span style={{ fontStyle: 'italic', color: 'var(--black)' }}>automated privacy eradication protocols</span> for users who need visibility into stale accounts, breached identities, and data-broker persistence.
                        </div>
                        <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--black)', borderRadius: '50%' }}></div>
                        <button className="pill-btn" onClick={enterDashboard}>Initiate Scan</button>
                    </div>
                </section>

                <section className="section-pad">
                    <div className="threat-header">
                        <div className="threat-header-left title-sm">Identified<br />Vulnerabilities</div>
                    </div>

                    <div className="threat-grid">
                        <div className="threat-card">
                            <div className="threat-img-box">
                                <SecurityVisual variant="archive" />
                            </div>
                            <div className="threat-meta">
                                <span className="threat-title">Legacy Subscriptions</span>
                                <span className="utility-text">32 Exposures</span>
                            </div>
                            <div className="utility-text" style={{ marginTop: '4px' }}>Dormant accounts tied to active payment methods, recovery emails, and retained billing data.</div>
                        </div>

                        <div className="threat-card offset">
                            <div className="threat-img-box">
                                <SecurityVisual variant="breach" />
                            </div>
                            <div className="threat-meta">
                                <span className="threat-title">Breached Credentials</span>
                                <span className="utility-text" style={{ color: '#d00000' }}>Critical Risk</span>
                            </div>
                            <div className="utility-text" style={{ marginTop: '4px' }}>Passwords and linked identities exposed in historic dumps and resurfacing broker datasets.</div>
                        </div>

                        <div className="threat-card" style={{ marginTop: '8vw' }}>
                            <div className="threat-img-box">
                                <SecurityVisual variant="network" />
                            </div>
                            <div className="threat-meta">
                                <span className="threat-title">Orphaned Forums</span>
                                <span className="utility-text">14 Profiles</span>
                            </div>
                            <div className="utility-text" style={{ marginTop: '4px' }}>Abandoned communities still exposing aliases, location hints, and long-tail identity records.</div>
                        </div>
                    </div>
                </section>

                <section className="intro-block" id="architecture">
                    <div className="label">The core philosophy</div>
                    <h2 className="intro-title">Absolute Control</h2>
                    <div style={{ gridColumn: '2' }}></div>
                    <div className="intro-text-wrapper">
                        <p className="intro-p">
                            Our architectural slogan, "Erase to exist," remains central to our protocol, rooting GhostGuard in an approach to digital security that values removal over accumulation.
                        </p>
                        <p className="utility-text">
                            The platform is designed to discover traces, classify real risk, and convert those findings into removal actions. That is why the dashboard is treated as an operational control room rather than a static report.
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
