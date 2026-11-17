import requestWithRetries from '#utils/meetings/requestWithEntries.ts'
import { renderPage } from '#utils/meetings/wikiPage.ts'

const { WIKI_SITE_ID } = process.env

if (!WIKI_SITE_ID) {
    throw new Error('Missing WIKI_SITE_ID in createPage.ts')
}

type CreatePageProps = {
    content: string
    description: string
    path: string
    title: string
}

export default async function createPage({ content, description, path, title }: CreatePageProps) {
    const result = await requestWithRetries({
        path: `/sites/${WIKI_SITE_ID}/pages`,
        method: 'POST',
        body: {
            content,
            description,
            editor: 'markdown',
            locale: 'en',
            path: path.replace(/^\//, ''),
            publishState: 'published',
            tags: ['TekKom', 'TekKom Verv', 'Møte', 'TekKom Møte', 'TekKom Verv Møte', 'Meeting', 'TekKom Meeting'],
            title
        }
    })

    await renderPage(result.page.id)
    return result
}
