import { useEffect, useMemo, useState } from 'react'
import { fetchEmailPreviews, searchServiceMessageIds, trashMessageIds, type EmailListItem } from './gmailCleanup'
import './landing.css'

interface EmailViewerModalProps {
  accessToken: string
  domain: string
  serviceName: string
  onClose: () => void
  onDeleteComplete: (deletedCount: number) => void
}

function formatMessageDate(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function EmailViewerModal({
  accessToken,
  domain,
  serviceName,
  onClose,
  onDeleteComplete,
}: EmailViewerModalProps) {
  const [emails, setEmails] = useState<EmailListItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHint, setSearchHint] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const fetchEmails = async () => {
      setLoading(true)
      setError(null)
      setSearchHint(null)
      setSelectedIds([])

      try {
        const { messageIds, usedQuery } = await searchServiceMessageIds(accessToken, domain)
        const { emails: messageDetails, rejectedCount } = await fetchEmailPreviews(accessToken, messageIds)

        if (!messageDetails.length) {
          throw new Error('Gmail returned matching IDs, but GhostGuard could not load their previews.')
        }

        if (active) {
          setEmails(messageDetails)
          if (usedQuery) {
            setSearchHint(`Matched using Gmail query: ${usedQuery}`)
          }
          if (rejectedCount > 0) {
            setError(`Loaded ${messageDetails.length} email previews, but ${rejectedCount} message preview${rejectedCount === 1 ? '' : 's'} could not be fetched.`)
          }
        }
      } catch (fetchError) {
        console.error(fetchError)
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'GhostGuard could not load the matching Gmail messages for this service.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchEmails()

    return () => {
      active = false
    }
  }, [accessToken, domain])

  const allSelected = useMemo(() => {
    return emails.length > 0 && selectedIds.length === emails.length
  }, [emails.length, selectedIds.length])

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    )
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : emails.map((email) => email.id))
  }

  const handleDelete = async () => {
    if (!selectedIds.length) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await trashMessageIds(accessToken, selectedIds)

      onDeleteComplete(selectedIds.length)
      onClose()
    } catch (deleteError) {
      console.error(deleteError)
      setError(deleteError instanceof Error ? deleteError.message : 'GhostGuard could not move the selected emails to Trash.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="auth-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="email-viewer-title">
      <div className="auth-modal draft-modal email-modal">
        <button className="auth-close" onClick={onClose} aria-label="Close email viewer">
          x
        </button>
        <div className="label">Inbox Cleanup</div>
        <h2 id="email-viewer-title" className="auth-title">{serviceName} Emails</h2>
        <p className="auth-copy">Review Gmail messages from `{domain}` and move only the ones you explicitly select to Trash.</p>
        {searchHint && <p className="utility-text">{searchHint}</p>}

        {loading ? (
          <p className="utility-text">Loading Gmail messages...</p>
        ) : error && emails.length === 0 ? (
          <p className="auth-error">{error}</p>
        ) : emails.length === 0 ? (
          <p className="utility-text">No matching Gmail messages were found for this service.</p>
        ) : (
          <>
            {error && <p className="auth-error">{error}</p>}
            <div className="email-modal-toolbar">
              <button className="table-action" onClick={toggleSelectAll}>
                {allSelected ? 'Clear Selection' : 'Select All'}
              </button>
              <span className="utility-text">{selectedIds.length} selected</span>
            </div>
            <div className="email-list">
              {emails.map((email) => (
                <label key={email.id} className="email-card">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(email.id)}
                    onChange={() => toggleSelected(email.id)}
                  />
                  <div className="email-card-body">
                    <div className="email-card-top">
                      <span className="dashboard-service">{email.subject}</span>
                      <span className="utility-text">{formatMessageDate(email.date)}</span>
                    </div>
                    <p className="utility-text email-snippet">{email.snippet}</p>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="dashboard-actions">
          <button
            className="pill-btn"
            onClick={handleDelete}
            disabled={deleting || loading || selectedIds.length === 0}
          >
            {deleting ? 'Moving...' : 'Move Selected Emails To Trash'}
          </button>
          <button className="pill-btn pill-btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
