import { TextChannel } from 'discord.js'
import updateStyretTemplate from '#utils/meetings/updateStyretTemplate.ts'
import { getPage } from '#utils/meetings/wikiPage.ts'
import getNextPathYearAndWeek from '#utils/meetings/getNextPathYearAndWeek.ts'
import createPage from '#utils/meetings/createPage.ts'
import { envLoad } from 'utilbee'

envLoad({ path: '.env' })

const {
    TEKKOM_MEETINGS_URL,
    STYRET_MEETINGS_URL,
    WIKI_URL,
    WIKI_STYRET_TEMPLATE_ID,
    WIKI_TEKKOM_TEMPLATE_ID,
} = process.env

if (
    !TEKKOM_MEETINGS_URL
    || !STYRET_MEETINGS_URL
    || !WIKI_URL
    || !WIKI_STYRET_TEMPLATE_ID
    || !WIKI_TEKKOM_TEMPLATE_ID
) {
    throw new Error('Missing essential environment variables in wiki.ts')
}

type AutoCreateProps = {
    channel: TextChannel
    isStyret: boolean
}

export default async function autoCreate({ channel, isStyret }: AutoCreateProps) {
    const path = getNextPathYearAndWeek(isStyret)
    const templateId = isStyret ? WIKI_STYRET_TEMPLATE_ID : WIKI_TEKKOM_TEMPLATE_ID
    const page = await getPage(templateId!)
    const content = page.content
    const now = new Date().toISOString()
    const filledTemplate = content
        .replace(new RegExp(`${path.currentPath}`, 'g'), path.nextPath)
        .replace('00.00.0000', path.date)
        .replace('00.00.00', path.date)
    const fullPath = `${isStyret ? STYRET_MEETINGS_URL : TEKKOM_MEETINGS_URL}${path.nextPath}`
    const updatedTemplate = await updateStyretTemplate({
        channel,
        isStyret,
        template: filledTemplate,
        week: String(path.currentWeek)
    })

    if (!updatedTemplate) {
        console.log(`Failed to obtain updated ${isStyret ? 'Styret' : 'TekKom'} template at: ${now}`)
        return
    }

    const createResponse = await createPage({
        content: updatedTemplate,
        description: isStyret
            ? `Styremøte uke ${path.currentWeek}`
            : `TekKom Meeting Week ${path.currentWeek}`,
        path: fullPath,
        tags: [
            ...(isStyret
                ? ['Styret', 'Møte', 'Styremøte']
                : ['TekKom', 'TekKom Verv', 'Møte', 'TekKom Møte', 'TekKom Verv Møte', 'Meeting', 'TekKom Meeting']),
            path.nextPath.slice(0, 4)
        ],
        title: path.nextPath
    })

    console.log(`Create response for ${isStyret ? 'Styret' : 'TekKom'} at ${now}: ${JSON.stringify(createResponse)}`)
}
