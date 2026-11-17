import requestWithRetries from '#utils/meetings/requestWithEntries.ts'

const { WIKI_SITE_ID } = process.env

if (!WIKI_SITE_ID) {
    throw new Error('Missing WIKI_SITE_ID in wikiPage.ts')
}

export type WikiPage = {
    id: string
    path: string
    title: string
    description: string | null
    content: string
}

export function getPage(pageId: string): Promise<WikiPage> {
    return requestWithRetries({
        path: `/sites/${WIKI_SITE_ID}/pages/${pageId}?withContent=true&locale=en`
    })
}

export function updatePage(pageId: string, body: Record<string, unknown>) {
    return requestWithRetries({
        path: `/sites/${WIKI_SITE_ID}/pages/${pageId}`,
        method: 'PATCH',
        body
    })
}

export function renderPage(pageId: string) {
    return requestWithRetries({
        path: `/sites/${WIKI_SITE_ID}/pages/${pageId}/render`,
        method: 'POST'
    })
}
