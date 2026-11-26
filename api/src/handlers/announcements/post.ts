import run from '#db'
import tokenWrapper from '#utils/tokenWrapper.ts'
import type { FastifyReply, FastifyRequest } from 'fastify'

export default async function postAnnouncements(req: FastifyRequest, res: FastifyReply) {
    const { title, description, channel, roles, embed, color, interval, time, event_id } = req.body as Announcement ?? {}
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: 'Unauthorized' })
    }

    if (!channel || (!event_id && (!title?.length || !description?.length))) {
        return res.status(400).send({ error: 'Channel and either an event or a title and description must be provided.' })
    }

    try {
        console.log(`Adding announcement with title '${title}', description
            '${description}', channel '${channel}', roles '${roles}',
            embed '${embed}', color '${color}', interval '${interval}',
            time '${time}' and event '${event_id}'.`)

        await run(
            `INSERT INTO announcements (title, description, channel, roles, embed, color, interval, time, event_id)
             SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9;`,
            [
                title || [],
                description || [],
                channel,
                roles || null,
                typeof embed === 'boolean' ? embed : false,
                color || null,
                interval || null,
                time || null,
                event_id || null
            ]
        )

        const name = title?.[0] ?? `for event ${event_id}`
        return res.send({ message: `Successfully added announcement ${name}${interval ? ` with interval ${interval}` : ''}.` })
    } catch (error) {
        console.log(`Database error: ${JSON.stringify(error)}`)
        return res.status(500).send({ error: 'Internal Server Error' })
    }
}
