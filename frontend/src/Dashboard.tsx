import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import EmailViewerModal from './EmailViewerModal'
import { searchServiceMessageIds, trashMessageIds } from './gmailCleanup'
import { aggregateHeaderGroups, demoCandidates, type MessageHeader, type PersonalContact } from './scan'
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
type ReviewFilter = 'all' | 'ghost' | 'breached' | 'unreviewed' | 'reviewed'
type SortOption = 'risk' | 'recent' | 'oldest' | 'signals' | 'confidence'

interface EmailViewerTarget {
    serviceKey: string
    serviceName: string
    domain: string
}

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

function deriveConfidence(service: ServiceInfo, decision?: ReviewDecision) {
    if (decision === 'still-use') {
        return {
            score: 96,
            label: 'High',
            reason: 'User confirmed the account is still in use.',
        }
    }

    if (decision === 'not-using') {
        const score = service.status === 'Ghost' ? 94 : 88
        return {
            score,
            label: score >= 90 ? 'High' : 'Medium',
            reason: 'User confirmed the account is no longer used.',
        }
    }

    if (decision === 'unsure') {
        return {
            score: 58,
            label: 'Low',
            reason: 'User review is inconclusive, so the result relies on inbox evidence only.',
        }
    }

    if (service.status === 'Ghost') {
        return {
            score: 72,
            label: 'Medium',
            reason: 'Older inbox signals suggest dormancy, but the user has not confirmed it yet.',
        }
    }

    if (service.status === 'Dormant') {
        return {
            score: 64,
            label: 'Medium',
            reason: 'Some evidence of reduced activity exists, but certainty is limited without user review.',
        }
    }

    return {
        score: 61,
        label: 'Medium',
        reason: 'Recent inbox activity suggests the account is active, but the user has not reviewed it yet.',
    }
}

function deriveClassificationReason(decision?: ReviewDecision, finalStatus?: FinalStatus) {
    if (decision === 'still-use') {
        return 'Final status is driven by explicit user confirmation that the service is still needed.'
    }

    if (decision === 'not-using') {
        return 'Final status is driven by explicit user confirmation that the service is no longer needed.'
    }

    if (decision === 'unsure') {
        return 'The user marked this as uncertain, so GhostGuard kept the inbox-based status.'
    }

    if (finalStatus === 'Ghost') {
        return 'This looks like a ghost account because recent inbox evidence is weak and the last signal is old.'
    }

    if (finalStatus === 'Dormant') {
        return 'This looks dormant because the service still appears in the inbox, but recent activity is limited.'
    }

    return 'This looks active because the service still has comparatively recent inbox activity.'
}

function getRiskScore(service: ServiceInfo & { finalStatus: FinalStatus; confidence: { score: number } }) {
    const statusScore = service.finalStatus === 'Ghost' ? 3 : service.finalStatus === 'Dormant' ? 2 : 1
    const breachScore = service.breached ? 3 : 0
    const confidenceScore = Math.round((100 - service.confidence.score) / 25)
    return statusScore + breachScore + confidenceScore
}

function Dashboard() {
    const navigate = useNavigate()
    const { accessToken, grantedScopes, hasGmailModifyScope, openAuthModal, signOut, user } = useAuth()
    const [services, setServices] = useState<ServiceInfo[]>([])
    const [personalContacts, setPersonalContacts] = useState<PersonalContact[]>([])
    const [loading, setLoading] = useState(false)
    const [draft, setDraft] = useState<string | null>(null)
    const [showDraft, setShowDraft] = useState(false)
    const [notice, setNotice] = useState<string | null>(null)
    const [reviewDecisions, setReviewDecisions] = useState<Record<string, ReviewDecision>>({})
    const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all')
    const [sortOption, setSortOption] = useState<SortOption>('risk')
    const [emailViewerTarget, setEmailViewerTarget] = useState<EmailViewerTarget | null>(null)
    const [selectedServiceKeys, setSelectedServiceKeys] = useState<string[]>([])
    const [hiddenServiceKeys, setHiddenServiceKeys] = useState<string[]>([])

    const resetScanState = () => {
        setReviewDecisions({})
        setReviewFilter('all')
        setSortOption('risk')
        setPersonalContacts([])
        setSelectedServiceKeys([])
        setHiddenServiceKeys([])
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
        setReviewDecisions({})
        setReviewFilter('all')
        setSortOption('risk')
        setSelectedServiceKeys([])
        setHiddenServiceKeys([])
        setNotice(`Mapped ${data.length} service domains without sending raw inbox content to the backend.`)
    }

    const scanInbox = async () => {
        if (!accessToken || !hasGmailModifyScope) {
            openAuthModal('Connect Gmail before scanning. GhostGuard needs Gmail cleanup access so it can inspect and delete selected service emails.')
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

            const scanResult = aggregateHeaderGroups(headerGroups)
            setPersonalContacts(scanResult.personalContacts)

            if (!scanResult.services.length && !scanResult.personalContacts.length) {
                setServices([])
                resetScanState()
                setNotice('The scan completed, but no external service domains were detected from sender metadata.')
                return
            }

            if (!scanResult.services.length) {
                setServices([])
                setReviewDecisions({})
                setReviewFilter('all')
                setSortOption('risk')
                setSelectedServiceKeys([])
                setHiddenServiceKeys([])
                setNotice(`Found ${scanResult.personalContacts.length} personal contact${scanResult.personalContacts.length === 1 ? '' : 's'}, but no external services to analyze.`)
                return
            }

            await analyzeCandidates(scanResult.services)
        } catch (error) {
            console.error('Scan failed:', error)
            setNotice('Gmail scan failed. Check the granted scope and backend connection, then retry the inbox scan.')
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
                body: JSON.stringify({ service_name: service }),
            })
            const data = await response.json()
            setDraft(data.draft)
            setShowDraft(true)
        } catch (error) {
            console.error('Draft failed:', error)
            setDraft(`To: privacy@${service.toLowerCase()}.com\nSubject: Data Deletion Request\n\nPlease delete my account and associated personal data and confirm when the request is complete.\n\nAccount email: [Your Email]\n\nRegards,\n[Your Name]`)
            setShowDraft(true)
        }
    }

    const setReviewDecision = (serviceKey: string, decision: ReviewDecision) => {
        setReviewDecisions((current) => ({
            ...current,
            [serviceKey]: decision,
        }))
    }

    const getServiceKey = (service: ServiceInfo) => `${service.service}-${service.domain}`

    const toggleServiceSelection = (serviceKey: string) => {
        setSelectedServiceKeys((current) => (
            current.includes(serviceKey)
                ? current.filter((entry) => entry !== serviceKey)
                : [...current, serviceKey]
        ))
    }

    const hideServices = (serviceKeys: string[]) => {
        if (!serviceKeys.length) {
            return
        }

        setHiddenServiceKeys((current) => Array.from(new Set([...current, ...serviceKeys])))
        setSelectedServiceKeys((current) => current.filter((entry) => !serviceKeys.includes(entry)))
        setNotice(`Hidden ${serviceKeys.length} service${serviceKeys.length === 1 ? '' : 's'} from the current review list.`)
    }

    const openEmailViewer = (service: ServiceInfo) => {
        setEmailViewerTarget({
            serviceKey: getServiceKey(service),
            serviceName: service.service,
            domain: service.domain,
        })
    }

    const handleDeleteComplete = (deletedCount: number) => {
        if (!emailViewerTarget) {
            return
        }

        setServices((current) => current.map((service) => {
            const serviceKey = getServiceKey(service)

            if (serviceKey !== emailViewerTarget.serviceKey) {
                return service
            }

            return {
                ...service,
                messageCount: Math.max(service.messageCount - deletedCount, 0),
            }
        }))

        setNotice(`Moved ${deletedCount} Gmail message${deletedCount === 1 ? '' : 's'} to Trash for ${emailViewerTarget.serviceName}.`)
    }

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
        const confidence = deriveConfidence(service, reviewDecision)

        return {
            ...service,
            serviceKey,
            reviewDecision,
            finalStatus,
            confidence,
            reason: deriveClassificationReason(reviewDecision, finalStatus),
        }
    })

    const visibleReviewedServices = reviewedServices.filter((service) => !hiddenServiceKeys.includes(service.serviceKey))

    const filteredServices = visibleReviewedServices.filter((service) => {
        if (reviewFilter === 'ghost') {
            return service.finalStatus === 'Ghost'
        }

        if (reviewFilter === 'breached') {
            return service.breached
        }

        if (reviewFilter === 'unreviewed') {
            return !service.reviewDecision
        }

        if (reviewFilter === 'reviewed') {
            return Boolean(service.reviewDecision)
        }

        return true
    })

    const sortedServices = [...filteredServices].sort((left, right) => {
        if (sortOption === 'recent') {
            return new Date(right.lastSeen).getTime() - new Date(left.lastSeen).getTime()
        }

        if (sortOption === 'oldest') {
            return new Date(left.lastSeen).getTime() - new Date(right.lastSeen).getTime()
        }

        if (sortOption === 'signals') {
            return right.messageCount - left.messageCount
        }

        if (sortOption === 'confidence') {
            return right.confidence.score - left.confidence.score
        }

        return getRiskScore(right) - getRiskScore(left)
    })

    const selectedVisibleServices = visibleReviewedServices.filter((service) => selectedServiceKeys.includes(service.serviceKey))
    const needsReviewServices = visibleReviewedServices.filter((service) => (
        !service.reviewDecision || service.breached || service.confidence.score < 70
    )).slice(0, 5)

    const allFilteredSelected = sortedServices.length > 0 && sortedServices.every((service) => selectedServiceKeys.includes(service.serviceKey))

    const toggleSelectAllFiltered = () => {
        if (!filteredServices.length) {
            return
        }

        if (allFilteredSelected) {
            setSelectedServiceKeys((current) => current.filter((serviceKey) => !sortedServices.some((service) => service.serviceKey === serviceKey)))
            return
        }

        setSelectedServiceKeys((current) => Array.from(new Set([
            ...current,
            ...sortedServices.map((service) => service.serviceKey),
        ])))
    }

    const summary = {
        total: visibleReviewedServices.length,
        ghost: visibleReviewedServices.filter((service) => service.finalStatus === 'Ghost').length,
        breached: visibleReviewedServices.filter((service) => service.breached).length,
        reviewed: visibleReviewedServices.filter((service) => Boolean(service.reviewDecision)).length,
        personal: personalContacts.length,
        hidden: hiddenServiceKeys.length,
    }

    const fetchDeletionDraft = async (serviceName: string) => {
        const response = await fetch(`${API_BASE_URL}/generate-deletion-draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service_name: serviceName }),
        })

        if (!response.ok) {
            throw new Error(`Unable to generate a draft for ${serviceName}.`)
        }

        const data = await response.json()
        return data.draft as string
    }

    const exportVisibleReport = () => {
        if (!visibleReviewedServices.length) {
            setNotice('Nothing is available to export yet.')
            return
        }

        const rows = visibleReviewedServices.map((service) => [
            service.service,
            service.domain,
            service.accountType,
            service.messageCount.toString(),
            service.lastSeen,
            service.status,
            service.reviewDecision ?? 'Unreviewed',
            service.finalStatus,
            service.confidence.score.toString(),
            service.breached ? 'Breached' : 'Secure',
        ])

        const csv = [
            ['Service', 'Domain', 'Type', 'Signals', 'Last Seen', 'Signal Status', 'Review', 'Final Status', 'Confidence', 'Security'].join(','),
            ...rows.map((row) => row.map((value) => `"${value.split('"').join('""')}"`).join(',')),
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'ghostguard-report.csv'
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        URL.revokeObjectURL(url)
        setNotice(`Exported ${visibleReviewedServices.length} visible service${visibleReviewedServices.length === 1 ? '' : 's'} to CSV.`)
    }

    const generateBatchDraft = async () => {
        if (!selectedVisibleServices.length) {
            return
        }

        setLoading(true)
        setNotice(null)

        try {
            const draftSections = await Promise.all(selectedVisibleServices.map(async (service, index) => {
                const draftText = await fetchDeletionDraft(service.service)
                return `Service ${index + 1}: ${service.service}\nDomain: ${service.domain}\n\n${draftText}`
            }))

            setDraft(draftSections.join('\n\n------------------------------\n\n'))
            setShowDraft(true)
            setNotice(`Generated ${selectedVisibleServices.length} deletion draft${selectedVisibleServices.length === 1 ? '' : 's'} in one batch.`)
        } catch (error) {
            console.error('Batch draft failed:', error)
            setNotice(error instanceof Error ? error.message : 'Batch draft generation failed.')
        } finally {
            setLoading(false)
        }
    }

    const deleteSelectedServices = async () => {
        if (!accessToken || !hasGmailModifyScope || !selectedVisibleServices.length) {
            return
        }

        setLoading(true)
        setNotice(null)

        try {
            const matchResults = await Promise.all(selectedVisibleServices.map(async (service) => {
                const { messageIds } = await searchServiceMessageIds(accessToken, service.domain, 50)
                return {
                    service,
                    messageIds,
                }
            }))

            const idsByServiceKey = new Map(matchResults.map((entry) => [entry.service.serviceKey, entry.messageIds]))
            const uniqueMessageIds = Array.from(new Set(matchResults.flatMap((entry) => entry.messageIds)))

            if (!uniqueMessageIds.length) {
                setNotice('GhostGuard could not find matching Gmail messages for the selected services.')
                return
            }

            await trashMessageIds(accessToken, uniqueMessageIds)

            setServices((current) => current.map((service) => {
                const serviceKey = getServiceKey(service)
                const matchedIds = idsByServiceKey.get(serviceKey) ?? []
                if (!matchedIds.length) {
                    return service
                }

                return {
                    ...service,
                    messageCount: Math.max(service.messageCount - matchedIds.length, 0),
                }
            }))

            setNotice(`Moved ${uniqueMessageIds.length} Gmail message${uniqueMessageIds.length === 1 ? '' : 's'} to Trash across ${matchResults.length} selected service${matchResults.length === 1 ? '' : 's'}.`)
        } catch (error) {
            console.error('Batch delete failed:', error)
            setNotice(error instanceof Error ? error.message : 'GhostGuard could not delete the selected service emails.')
        } finally {
            setLoading(false)
        }
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
                            Review sanitized service domains, scan Gmail, and generate draft deletion requests without storing mailbox data.
                        </p>
                        <p className="utility-text">GhostGuard reads `From` and `Date` headers in the browser, strips them down to domains, and sends only those summaries to the backend.</p>
                        {user?.email && (
                            <p className="utility-text">
                                Gmail cleanup scope status: {hasGmailModifyScope ? 'Granted' : 'Missing'}.
                                {!hasGmailModifyScope && ' Reconnect Gmail after removing GhostGuard from Google permissions.'}
                            </p>
                        )}
                        <div className="dashboard-actions">
                            <button onClick={scanInbox} disabled={loading} className="pill-btn">
                                {loading ? 'Scanning...' : 'Scan Gmail'}
                            </button>
                            <button onClick={loadDemoScan} disabled={loading} className="pill-btn pill-btn-outline">
                                Load Sample
                            </button>
                            <button onClick={exportVisibleReport} disabled={visibleReviewedServices.length === 0} className="pill-btn pill-btn-outline">
                                Export Report
                            </button>
                        </div>
                        {grantedScopes.length > 0 && (
                            <div className="dashboard-field">
                                <span className="label">Granted Scopes</span>
                                <div className="utility-text scope-list">{grantedScopes.join(', ')}</div>
                            </div>
                        )}
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
                    <div className="dashboard-stat">
                        <div className="utility-text">Personal Contacts</div>
                        <div className="dashboard-stat-value">{summary.personal}</div>
                    </div>
                    <div className="dashboard-stat">
                        <div className="utility-text">Hidden</div>
                        <div className="dashboard-stat-value">{summary.hidden}</div>
                    </div>
                </section>

                {notice && (
                    <section className="dashboard-notice utility-text">
                        {notice}
                    </section>
                )}

                {needsReviewServices.length > 0 && (
                    <section className="dashboard-panel">
                        <div className="dashboard-panel-header">
                            <div className="label">Needs Review</div>
                            <div className="utility-text">These services are either unreviewed, breached, or still low-confidence.</div>
                        </div>
                        <div className="needs-review-list">
                            {needsReviewServices.map((service) => (
                                <div key={service.serviceKey} className="needs-review-card">
                                    <div>
                                        <div className="dashboard-service">{service.service}</div>
                                        <div className="utility-text">{service.domain}</div>
                                    </div>
                                    <div className="utility-text">
                                        {service.breached ? 'Breached. ' : ''}
                                        {service.reviewDecision ? service.reason : 'Still waiting for user confirmation.'}
                                    </div>
                                    <button className="table-action" onClick={() => setReviewFilter(service.reviewDecision ? 'breached' : 'unreviewed')}>
                                        Focus
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="dashboard-filters">
                    <button className={`filter-chip ${reviewFilter === 'all' ? 'filter-chip-selected' : ''}`} onClick={() => setReviewFilter('all')}>
                        All
                    </button>
                    <button className={`filter-chip ${reviewFilter === 'ghost' ? 'filter-chip-selected' : ''}`} onClick={() => setReviewFilter('ghost')}>
                        Ghost
                    </button>
                    <button className={`filter-chip ${reviewFilter === 'breached' ? 'filter-chip-selected' : ''}`} onClick={() => setReviewFilter('breached')}>
                        Breached
                    </button>
                    <button className={`filter-chip ${reviewFilter === 'unreviewed' ? 'filter-chip-selected' : ''}`} onClick={() => setReviewFilter('unreviewed')}>
                        Unreviewed
                    </button>
                    <button className={`filter-chip ${reviewFilter === 'reviewed' ? 'filter-chip-selected' : ''}`} onClick={() => setReviewFilter('reviewed')}>
                        Reviewed
                    </button>
                    <label className="sort-control">
                        <span className="label">Sort</span>
                        <select className="sort-select" value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}>
                            <option value="risk">Highest Risk</option>
                            <option value="recent">Most Recent</option>
                            <option value="oldest">Oldest Signal</option>
                            <option value="signals">Most Signals</option>
                            <option value="confidence">Highest Confidence</option>
                        </select>
                    </label>
                </section>

                <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div className="label">Exposure Ledger</div>
                        <div className="utility-text">Inbox signals are shown first, then refined with user confirmation and confidence scoring to stabilize the final classification.</div>
                    </div>

                    {sortedServices.length > 0 ? (
                        <>
                            <div className="dashboard-batch-bar">
                                <div className="utility-text">{selectedVisibleServices.length} service{selectedVisibleServices.length === 1 ? '' : 's'} selected</div>
                                <div className="dashboard-batch-actions">
                                    <button className="table-action" onClick={toggleSelectAllFiltered}>
                                        {allFilteredSelected ? 'Clear Visible Selection' : 'Select Visible'}
                                    </button>
                                    <button className="table-action" onClick={generateBatchDraft} disabled={selectedVisibleServices.length === 0 || loading}>
                                        Draft Selected
                                    </button>
                                    <button
                                        className="table-action"
                                        onClick={deleteSelectedServices}
                                        disabled={selectedVisibleServices.length === 0 || !accessToken || !hasGmailModifyScope || loading}
                                    >
                                        Delete Selected
                                    </button>
                                    <button className="table-action" onClick={() => hideServices(selectedVisibleServices.map((service) => service.serviceKey))} disabled={selectedVisibleServices.length === 0}>
                                        Hide Selected
                                    </button>
                                    <button className="table-action" onClick={exportVisibleReport}>
                                        Export Visible
                                    </button>
                                </div>
                            </div>
                            <div className="dashboard-table-wrap">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Select</th>
                                        <th>Service</th>
                                        <th>Type</th>
                                        <th>Signals</th>
                                        <th>Last Seen</th>
                                        <th>Signal Status</th>
                                        <th>User Review</th>
                                        <th>Final Status</th>
                                        <th>Why</th>
                                        <th>Confidence</th>
                                        <th>Security</th>
                                        <th className="table-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedServices.map((service) => (
                                        <tr key={service.serviceKey}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedServiceKeys.includes(service.serviceKey)}
                                                    onChange={() => toggleServiceSelection(service.serviceKey)}
                                                />
                                            </td>
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
                                                <div className="utility-text reason-text">{service.reason}</div>
                                            </td>
                                            <td>
                                                <div className="confidence-score">{service.confidence.score}%</div>
                                                <div className="utility-text confidence-caption">{service.confidence.label} confidence</div>
                                                <div className="utility-text confidence-caption">{service.confidence.reason}</div>
                                            </td>
                                            <td>
                                                <span className={service.breached ? 'dashboard-risk dashboard-risk-critical' : 'dashboard-risk'}>
                                                    {service.breached ? 'Breached' : 'Secure'}
                                                </span>
                                            </td>
                                            <td className="table-right">
                                                <div className="table-actions">
                                                    <button
                                                        className="table-action"
                                                        onClick={() => openEmailViewer(service)}
                                                        disabled={!accessToken || !hasGmailModifyScope || service.messageCount === 0}
                                                    >
                                                        View Emails
                                                    </button>
                                                    <button className="table-action" onClick={() => generateDraft(service.service)}>
                                                        Draft Deletion
                                                    </button>
                                                    <button className="table-action" onClick={() => hideServices([service.serviceKey])}>
                                                        Ignore
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </>
                    ) : (
                        <div className="dashboard-empty">
                            <p className="intro-p">{visibleReviewedServices.length > 0 ? 'No services match the current filter.' : 'No services found yet.'}</p>
                            <p className="utility-text">{visibleReviewedServices.length > 0 ? 'Choose a different filter to review other services.' : 'Run a Gmail scan or the sample mode to build the exposure ledger.'}</p>
                        </div>
                    )}
                </section>

                {personalContacts.length > 0 && (
                    <section className="dashboard-panel">
                        <div className="dashboard-panel-header">
                            <div className="label">Personal Contacts</div>
                            <div className="utility-text">Public email-provider contacts are shown separately so they are not misclassified as services.</div>
                        </div>
                        <div className="dashboard-table-wrap">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Contact</th>
                                        <th>Provider</th>
                                        <th>Signals</th>
                                        <th>Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {personalContacts.map((contact) => (
                                        <tr key={`${contact.contact}-${contact.domain}`}>
                                            <td>{contact.contact}</td>
                                            <td>{contact.domain}</td>
                                            <td>{contact.messageCount}</td>
                                            <td>{formatLastSeen(contact.lastSeen)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
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

            {emailViewerTarget && accessToken && (
                <EmailViewerModal
                    accessToken={accessToken}
                    domain={emailViewerTarget.domain}
                    serviceName={emailViewerTarget.serviceName}
                    onClose={() => setEmailViewerTarget(null)}
                    onDeleteComplete={handleDeleteComplete}
                />
            )}
        </div>
    )
}

export default Dashboard
