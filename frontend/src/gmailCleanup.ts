export interface GmailHeader {
  name: string
  value: string
}

interface GmailMessageListResponse {
  messages?: Array<{ id: string }>
  error?: {
    code?: number
    message?: string
  }
}

interface GmailMessageResponse {
  id: string
  snippet?: string
  error?: {
    code?: number
    message?: string
  }
  payload?: {
    headers?: GmailHeader[]
  }
}

interface GmailErrorResponse {
  error?: {
    code?: number
    message?: string
  }
}

export interface EmailListItem {
  id: string
  subject: string
  snippet: string
  date: string
}

export function buildSearchQueries(domain: string) {
  const rootLabel = domain.split('.')[0] ?? domain

  return [
    `from:${domain}`,
    `from:*@${domain}`,
    domain,
    rootLabel,
  ]
}

export async function searchServiceMessageIds(accessToken: string, domain: string, maxResults = 20) {
  const queries = buildSearchQueries(domain)
  let messageIds: string[] = []
  let usedQuery: string | null = null
  let lastError = 'Unable to load Gmail messages for this service.'

  for (const query of queries) {
    const searchQuery = encodeURIComponent(query)
    const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${searchQuery}&maxResults=${maxResults}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const listData = await listResponse.json() as GmailMessageListResponse

    if (!listResponse.ok) {
      lastError = listData.error?.message || `Gmail search failed for query: ${query}`
      continue
    }

    messageIds = (listData.messages ?? []).map((message) => message.id)

    if (messageIds.length > 0) {
      usedQuery = query
      break
    }
  }

  if (!messageIds.length) {
    throw new Error(lastError)
  }

  return {
    messageIds,
    usedQuery,
  }
}

export async function fetchEmailPreviews(accessToken: string, messageIds: string[]) {
  const detailResults = await Promise.allSettled(messageIds.map(async (messageId) => {
    const detailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=Date`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const detail = await detailResponse.json() as GmailMessageResponse

    if (!detailResponse.ok) {
      throw new Error(detail.error?.message || 'Unable to load one or more email previews.')
    }

    const headers = detail.payload?.headers ?? []
    const subject = headers.find((header) => header.name.toLowerCase() === 'subject')?.value ?? 'No subject'
    const date = headers.find((header) => header.name.toLowerCase() === 'date')?.value ?? 'Unknown date'

    return {
      id: detail.id,
      subject,
      snippet: detail.snippet ?? 'No preview available.',
      date,
    }
  }))

  const emails = detailResults
    .filter((result): result is PromiseFulfilledResult<EmailListItem> => result.status === 'fulfilled')
    .map((result) => result.value)

  return {
    emails,
    rejectedCount: detailResults.length - emails.length,
  }
}

export async function trashMessageIds(accessToken: string, messageIds: string[]) {
  const trashResults = await Promise.allSettled(messageIds.map(async (messageId) => {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let errorMessage = 'Unable to move one or more selected emails to Trash.'

      try {
        const errorData = await response.json() as GmailErrorResponse
        errorMessage = errorData.error?.message || errorMessage
      } catch {
        try {
          const errorText = await response.text()
          if (errorText.trim()) {
            errorMessage = errorText
          }
        } catch {
          // Keep the default message if the error body cannot be parsed.
        }
      }

      throw new Error(errorMessage)
    }
  }))

  const failedTrashResult = trashResults.find((result): result is PromiseRejectedResult => result.status === 'rejected')

  if (failedTrashResult) {
    throw failedTrashResult.reason instanceof Error
      ? failedTrashResult.reason
      : new Error('Unable to move one or more selected emails to Trash.')
  }

  return messageIds.length
}
