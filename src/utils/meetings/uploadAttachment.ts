import path from 'path'
import { envLoad } from 'utilbee'

envLoad({ path: '.env' })

const { WIKIJS_TOKEN, WIKI_URL, WIKI_SITE_ID } = process.env

if (!WIKIJS_TOKEN || !WIKI_URL || !WIKI_SITE_ID) {
    throw new Error('Missing WIKIJS_TOKEN or WIKI_SITE_ID in uploadAttachment.ts')
}

type WikiAttachmentProps = {
    attachment: string
    week: string
}

export default async function uploadAttachmentToWiki({attachment, week}: WikiAttachmentProps) {
    try {
        const response = await fetch(attachment)

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const baseName = path.basename(attachment)
        const name = `${week}_${uuid(8)}_${baseName.split('?')[0]}`
        const uploadResponse = await fetch(
            `${WIKI_URL}/_api/sites/${WIKI_SITE_ID}/assets?fileName=${encodeURIComponent(name)}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WIKIJS_TOKEN}`,
                    'Content-Type': response.headers.get('content-type') || 'application/octet-stream'
                },
                body: buffer
            }
        )

        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload file: ${uploadResponse.statusText}`)
        }

        const { asset } = await uploadResponse.json()
        return asset.fileName.toLowerCase()
    } catch (error) {
        console.log('Error uploading attachment:', error)
    }
}

function uuid(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    let counter = 0
    let result = ''
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
        counter ++
    }

    return result
}
