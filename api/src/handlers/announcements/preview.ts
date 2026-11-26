import buildCard, { BANNER_NAME, getEvent, type CardInput } from '#utils/card/card.ts'
import tokenWrapper from '#utils/tokenWrapper.ts'
import type { FastifyReply, FastifyRequest } from 'fastify'

type PreviewBody = CardInput & { event_id?: number | null }

export default async function previewAnnouncement(req: FastifyRequest, res: FastifyReply) {
    const { valid } = await tokenWrapper(req, res)
    if (!valid) {
        return res.status(400).send({ error: 'Unauthorized' })
    }

    const body = (req.body as PreviewBody) ?? {}
    try {
        const event = body.event ?? (body.event_id ? await getEvent(body.event_id) : null)
        const { components, banner } = await buildCard({ ...body, event })
        return res.send({
            components,
            files: banner ? { [`attachment://${BANNER_NAME}`]: `data:image/png;base64,${banner.toString('base64')}` } : {}
        })
    } catch (error) {
        console.log(`Preview failed: ${error}`)
        return res.status(500).send({ error: 'Could not build preview' })
    }
}
