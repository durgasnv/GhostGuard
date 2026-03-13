export interface MessageHeader {
  name: string
  value: string
}

export interface DomainCandidate {
  service: string
  domain: string
  lastSeen: string
  accountType: string
  messageCount: number
}

export interface PersonalContact {
  contact: string
  domain: string
  lastSeen: string
  messageCount: number
}

export interface ScanAggregationResult {
  services: DomainCandidate[]
  personalContacts: PersonalContact[]
}

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'google.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'me.com',
  'yahoo.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
])

function toIsoDate(value?: string) {
  if (!value) {
    return new Date().toISOString()
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString()
  }

  return parsed.toISOString()
}

function titleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function inferServiceName(domain: string) {
  const label = domain.split('.')[0]?.replace(/[-_]+/g, ' ') ?? domain
  return titleCase(label)
}

function inferContactName(email: string, domain: string) {
  const localPart = email.split('@')[0] ?? domain
  return titleCase(localPart.replace(/[._-]+/g, ' '))
}

function inferAccountType(domain: string) {
  if (/(cloud|drive|dropbox|storage)/i.test(domain)) return 'Storage'
  if (/(shop|store|pay|billing)/i.test(domain)) return 'Commerce'
  if (/(news|mail|post|letter)/i.test(domain)) return 'Communications'
  if (/(social|forum|community|chat)/i.test(domain)) return 'Community'
  if (/(design|figma|canva)/i.test(domain)) return 'Creative'
  return 'Linked Service'
}

function extractEmailAddress(value: string) {
  const bracketMatch = value.match(/<([^>]+)>/)
  if (bracketMatch?.[1]) {
    return bracketMatch[1].trim().toLowerCase()
  }

  const directMatch = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return directMatch?.[0]?.trim().toLowerCase() ?? null
}

function extractSourceFromFromHeader(value?: string) {
  if (!value) return null

  const email = extractEmailAddress(value)
  if (!email) return null

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) {
    return null
  }

  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return {
      type: 'Personal' as const,
      email,
      domain,
    }
  }

  return {
    type: 'Service' as const,
    email,
    domain,
  }
}

function toCandidateMap(headerGroups: MessageHeader[][]) {
  const candidates = new Map<string, DomainCandidate>()
  const personalContacts = new Map<string, PersonalContact>()

  for (const headers of headerGroups) {
    const fromHeader = headers.find((header) => header.name.toLowerCase() === 'from')?.value
    const dateHeader = headers.find((header) => header.name.toLowerCase() === 'date')?.value
    const source = extractSourceFromFromHeader(fromHeader)

    if (!source) {
      continue
    }

    const nextDate = toIsoDate(dateHeader)

    if (source.type === 'Personal') {
      const existingPersonal = personalContacts.get(source.email)

      if (!existingPersonal) {
        personalContacts.set(source.email, {
          contact: inferContactName(source.email, source.domain),
          domain: source.domain,
          lastSeen: nextDate,
          messageCount: 1,
        })
        continue
      }

      existingPersonal.messageCount += 1
      if (new Date(nextDate).getTime() > new Date(existingPersonal.lastSeen).getTime()) {
        existingPersonal.lastSeen = nextDate
      }
      continue
    }

    const existing = candidates.get(source.domain)

    if (!existing) {
      candidates.set(source.domain, {
        service: inferServiceName(source.domain),
        domain: source.domain,
        lastSeen: nextDate,
        accountType: inferAccountType(source.domain),
        messageCount: 1,
      })
      continue
    }

    existing.messageCount += 1
    if (new Date(nextDate).getTime() > new Date(existing.lastSeen).getTime()) {
      existing.lastSeen = nextDate
    }
  }

  return {
    services: candidates,
    personalContacts,
  }
}

export function aggregateHeaderGroups(headerGroups: MessageHeader[][]) {
  const { services, personalContacts } = toCandidateMap(headerGroups)

  return {
    services: Array.from(services.values()).sort((left, right) => {
      return new Date(right.lastSeen).getTime() - new Date(left.lastSeen).getTime()
    }),
    personalContacts: Array.from(personalContacts.values()).sort((left, right) => {
      return new Date(right.lastSeen).getTime() - new Date(left.lastSeen).getTime()
    }),
  } satisfies ScanAggregationResult
}

export function aggregateEmlText(text: string) {
  const sections = text
    .split(/\r?\n\r?\n/)
    .map((section) => section.trim())
    .filter(Boolean)

  const headerBlocks = sections.slice(0, 1).map((section) =>
    section
      .split(/\r?\n/)
      .map((line) => {
        const separator = line.indexOf(':')
        if (separator === -1) {
          return null
        }

        return {
          name: line.slice(0, separator).trim(),
          value: line.slice(separator + 1).trim(),
        }
      })
      .filter((header): header is MessageHeader => Boolean(header)),
  )

  return aggregateHeaderGroups(headerBlocks)
}

export function demoCandidates(): DomainCandidate[] {
  return [
    {
      service: 'Netflix',
      domain: 'netflix.com',
      lastSeen: '2026-02-14T00:00:00.000Z',
      accountType: 'Subscription',
      messageCount: 4,
    },
    {
      service: 'Dropbox',
      domain: 'dropbox.com',
      lastSeen: '2024-01-15T00:00:00.000Z',
      accountType: 'Storage',
      messageCount: 2,
    },
    {
      service: 'Linkedin',
      domain: 'linkedin.com',
      lastSeen: '2025-06-10T00:00:00.000Z',
      accountType: 'Professional',
      messageCount: 3,
    },
  ]
}
