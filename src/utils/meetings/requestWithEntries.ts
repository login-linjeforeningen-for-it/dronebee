import { envLoad } from 'utilbee'
import logStack from '#utils/meetings/logStack.ts'

type RequestWithRetriesProps = {
    path: string
    method?: 'GET' | 'POST' | 'PATCH'
    body?: unknown
    retries?: number
    delay?: number
}

envLoad({ path: '.env' })

const { WIKI_URL, WIKIJS_TOKEN } = process.env

if (!WIKI_URL || !WIKIJS_TOKEN) {
    throw new Error('Missing essential environment variables in requestWithEntries.ts')
}

export default async function requestWithRetries({
    path,
    method = 'GET',
    body,
    retries = 10,
    delay = 1000
}: RequestWithRetriesProps) {
    while (retries > 0) {
        try {
            const response = await fetch(`${WIKI_URL}/_api${path}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${WIKIJS_TOKEN}`,
                    ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
                },
                body: body === undefined ? undefined : JSON.stringify(body)
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(data)}`)
            }

            return data
        } catch (error) {
            console.log(`Wiki API request failed: ${error}`)
            logStack(error)
            retries--
            if (retries === 0) {
                throw new Error('Exceeded maximum retries for Wiki API request', { cause: error })
            }
            await new Promise(resolve => setTimeout(resolve, delay))
            delay *= 2
        }
    }
}
