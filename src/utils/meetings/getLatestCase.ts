import requestWithRetries from '#utils/meetings/requestWithEntries.ts'
import { getPage } from '#utils/meetings/wikiPage.ts'

const { WIKI_SITE_ID, STYRET_MEETINGS_URL } = process.env

if (!WIKI_SITE_ID || !STYRET_MEETINGS_URL) {
    throw new Error('Missing essential environment variables in getLatestCase.ts')
}

// Highest case number in the newest styret meetings; numbers run on across years.
export default async function getLatestCase() {
    const folder = STYRET_MEETINGS_URL!.replace(/^\/|\/$/g, '')
    const pages: { id: string }[] = await requestWithRetries({
        path: `/sites/${WIKI_SITE_ID}/tree/pages?path=${encodeURIComponent(folder)}&orderBy=createdAt&orderByDirection=desc&limit=5`
    })
    let latest = 0

    for (const { id } of pages) {
        const { content } = await getPage(id)

        for (const [, number] of content.matchAll(/\w - \d+ - Sak: (\d+)/g)) {
            latest = Math.max(latest, Number(number))
        }
    }

    if (!latest) {
        throw new Error(`No case numbers in the newest pages under ${folder}`)
    }

    return latest
}
