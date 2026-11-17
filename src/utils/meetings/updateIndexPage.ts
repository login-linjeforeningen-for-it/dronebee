import logStack from '#utils/meetings/logStack.ts'
import { getPage, renderPage, updatePage } from '#utils/meetings/wikiPage.ts'
import { envLoad } from 'utilbee'

envLoad({ path: '.env' })

type ModifyPageProps = {
    existingHTML: string
    path: Path
    isStyret: boolean
}

type UpdateIndexProps = {
    path: Path
    pageId: string
    isStyret: boolean
}

type Path = {
    currentPath: string
    nextPath: string
    date: string
}

const { TEKKOM_MEETINGS_URL, STYRET_MEETINGS_URL } = process.env

if (!TEKKOM_MEETINGS_URL || !STYRET_MEETINGS_URL) {
    throw new Error('Missing essential environment variables in wiki.ts')
}

// Function to update the page content
function modifyPage({ existingHTML, path, isStyret }: ModifyPageProps) {
    const paths = [TEKKOM_MEETINGS_URL, STYRET_MEETINGS_URL]
    const newEntry = `- [${path.nextPath}${isStyret ? ' - Styremøte' : ''}](${paths[isStyret ? 1 : 0]}${path.nextPath})`
    const styretRegex = /(- \[\d{4}-\d+ - Styremøte\]\(\/public\/docs\/minutes\/styremoter\/\d{4}-\d+\))/
    const tekkomRegex = /(- \[\d{4}-\d+\]\(\/tekkom\/meetings\/\d{4}-\d+\))/
    const regex = isStyret ? styretRegex : tekkomRegex

    if (existingHTML.includes(newEntry)) {
        return existingHTML
    }

    // Finds the first match to insert the new entry before it
    const firstMatch = existingHTML.match(regex)
    if (firstMatch) {
        const insertIndex = firstMatch.index
        const updatedHTML = `${existingHTML.slice(0, insertIndex)}${newEntry}\n${existingHTML.slice(insertIndex)}`
        return updatedHTML
    }

    // Determines the section header to insert into
    const styretString = '::block-tab{label="Styremøter"}'
    const tekkomString = '::block-tab{label="Minutes"}'
    const insertionPoint = existingHTML.indexOf(isStyret ? styretString : tekkomString)

    // Calculates the index to insert the new entry
    const index = insertionPoint + (isStyret ? styretString.length : tekkomString.length)

    // If no match is found, inserts at the start of the correct section
    const updatedHTML = `${existingHTML.slice(0, index)}\n${newEntry}${existingHTML.slice(index)}`
    return updatedHTML
}

// Fetches the page, adds the new document, and writes it back
export default async function updateIndex({ path, pageId, isStyret }: UpdateIndexProps) {
    try {
        const page = await getPage(pageId)
        const updatedContent = modifyPage({
            existingHTML: page.content,
            path,
            isStyret: page.content.includes('styremoter')
        })
        const TekKomTitle = 'Meetings'
        const TekKomDescription = isStyret
            ? 'Styretmøte referater. Denne siden er automatisert. ' +
            'Endre med forsiktighet for å unngå å ødelegge automatisjonen. Rapporter feil til Styret.'
            : 'TekKom meeting agendas and minutes. This page is automatically managed. ' +
            'Please edit with care. Report errors to TekKom.'
        await updatePage(pageId, {
            content: updatedContent,
            description: TekKomDescription,
            title: TekKomTitle
        })
        await renderPage(pageId)
        console.log(`${isStyret ? 'Styret' : 'TekKom'} index file updated successfully.`)
    } catch (error) {
        console.log(`Failed to update ${isStyret ? 'styret' : 'TekKom'} index file:\n${error}`)
        logStack(error)
    }
}
