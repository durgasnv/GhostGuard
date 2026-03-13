import { useState, useEffect } from 'react'
import { useAuth } from './auth'

interface EmailViewerModalProps {
    domain: string
    onClose: () => void
    onSuccess: () => void
}

interface MessageDetail {
    id: string
    subject: string
    snippet: string
    date: string
}

export function EmailViewerModal({ domain, onClose, onSuccess }: EmailViewerModalProps) {
    const { accessToken } = useAuth()
    const [messages, setMessages] = useState<MessageDetail[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        const fetchEmails = async () => {
            if (!accessToken) return

            try {
                // Fetch message IDs from this domain
                const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=from:${domain}&maxResults=50`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })

                if (!listRes.ok) throw new Error('Failed to fetch messages list')
                
                const listData = await listRes.json()
                const messageIds = listData.messages?.map((m: any) => m.id) || []

                if (messageIds.length === 0) {
                    setMessages([])
                    setLoading(false)
                    return
                }

                // Fetch details for each message
                const detailsPromises = messageIds.map(async (id: string) => {
                    const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=Date`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    })
                    
                    if (!detailRes.ok) return null

                    const detailData = await detailRes.json()
                    const headers = detailData.payload?.headers || []
                    
                    return {
                        id,
                        subject: headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)',
                        date: headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '',
                        snippet: detailData.snippet || ''
                    }
                })

                const details = await Promise.all(detailsPromises)
                setMessages(details.filter(Boolean) as MessageDetail[])
            } catch (err: any) {
                console.error(err)
                setError(err.message || 'An error occurred while fetching emails')
            } finally {
                setLoading(false)
            }
        }

        fetchEmails()
    }, [domain, accessToken])

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setSelectedIds(next)
    }

    const toggleAll = () => {
        if (selectedIds.size === messages.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(messages.map(m => m.id)))
        }
    }

    const handleDelete = async () => {
        if (selectedIds.size === 0 || !accessToken) return

        setDeleting(true)
        setError(null)
        
        try {
            const idsToDelete = Array.from(selectedIds)
            const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchDelete', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: idsToDelete })
            })

            if (!res.ok) {
                throw new Error('Failed to delete messages')
            }

            onSuccess() // Trigger rescan
            onClose() // Close modal
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to delete emails')
            setDeleting(false)
        }
    }

    return (
        <div className="auth-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="email-viewer-title">
            <div className="auth-modal" style={{ maxWidth: '800px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <button className="auth-close" onClick={onClose} aria-label="Close email viewer">
                    x
                </button>
                <div className="label">Clean Up Inbox</div>
                <h2 id="email-viewer-title" className="auth-title">Emails from {domain}</h2>
                
                {error && <p className="auth-error" style={{ marginBottom: '1rem' }}>{error}</p>}
                
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>Loading emails...</div>
                    ) : messages.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>No emails found from this sender.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#111', zIndex: 1 }}>
                                <tr>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', width: '40px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.size === messages.length && messages.length > 0}
                                            onChange={toggleAll}
                                        />
                                    </th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Date</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {messages.map(msg => (
                                    <tr key={msg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(msg.id)}
                                                onChange={() => toggleSelection(msg.id)}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                            {new Date(msg.date).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>{msg.subject}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                {msg.snippet}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                        {selectedIds.size} {selectedIds.size === 1 ? 'email' : 'emails'} selected
                    </div>
                    <div className="dashboard-actions" style={{ marginTop: 0 }}>
                        <button className="pill-btn pill-btn-outline" onClick={onClose} disabled={deleting}>
                            Cancel
                        </button>
                        <button 
                            className="pill-btn" 
                            style={{ background: selectedIds.size > 0 ? '#ef4444' : 'rgba(255,255,255,0.1)', color: selectedIds.size > 0 ? '#fff' : 'rgba(255,255,255,0.4)' }}
                            onClick={handleDelete}
                            disabled={selectedIds.size === 0 || deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete Selected Emails'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
