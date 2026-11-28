import run from '#db'
import alertSlowQuery from '#utils/alertSlowQuery.ts'
import formatRows from '#utils/formatRows.ts'
import { loadSQL } from '#utils/loadSQL.ts'
import buildCard, { getEvent } from '#utils/card/card.ts'
import type { FastifyReply, FastifyRequest } from 'fastify'

type GetAnnouncements = {
    id?: string
    search?: string
    offset?: string
    limit?: string
    active?: string
    shouldBeSent?: string
    includePlaceholders?: boolean | string
}

export default async function getAnnouncements(req: FastifyRequest, res: FastifyReply) {
    const { id, search, offset, limit, active, shouldBeSent, includePlaceholders } =  (req.query as GetAnnouncements) ?? {}

    if (id) {
        const result = await run('SELECT * FROM announcements WHERE id = $1;', [id])
        return res.send(result.rows)
    }

    const query = (await loadSQL('getAnnouncements.sql'))
    const offsetInt = parseInt(offset || '0', 10)
    const limitInt = parseInt(limit || '10', 10)
    const activeBool = active === 'true'
    const shouldBeSentBool = shouldBeSent === 'true'
    const searchTerm = search || ''
    const start = Date.now()
    const result = await run(query, [offsetInt, limitInt, activeBool, shouldBeSentBool, searchTerm])
    const duration = (Date.now() - start) / 1000
    alertSlowQuery(duration, 'Announcements')

    if (parseBool(includePlaceholders)) {
        return res.send({ announcements: result.rows, total_count: result.rows[0]?.total_count || 0 })
    }

    const finalRows = formatRows(result.rows)
    if (!shouldBeSentBool) {
        return res.send(finalRows)
    }

    const rows = await Promise.all(finalRows.map(withCard))
    return res.send(rows.filter(Boolean))
}

async function withCard(row: ReturnType<typeof formatRows>[number]) {
    if (!row.embed && !row.event_id) {
        return row
    }

    const input = { ...row, description: [row.description].flat() }
    try {
        const event = row.event_id ? await getEvent(row.event_id) : null
        const { components, banner } = await buildCard({ ...input, event })
        return { ...row, components, banner: banner?.toString('base64') }
    } catch (error) {
        console.log(`Failed to build card for announcement ${row.id}, retrying next run: ${error}`)
        return null
    }
}

function parseBool(value: unknown) {
    return value === true || value === 'true'
}
