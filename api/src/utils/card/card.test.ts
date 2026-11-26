import { describe, expect, test } from 'bun:test'
import buildCard, { toHex } from './card.ts'

const base = { name_no: 'BarKom', time_start: '2026-11-28T17:00:00', time_end: '2026-11-29T01:00:00' }

function texts(card: Awaited<ReturnType<typeof buildCard>>) {
    return JSON.stringify(card.components)
}

describe('toHex', () => {
    test('parses hex, short hex, bare hex and gradients', () => {
        expect(toHex('#A206C9')).toBe('#a206c9')
        expect(toHex('#fff')).toBe('#ffffff')
        expect(toHex('f1c40f')).toBe('#f1c40f')
        expect(toHex('linear-gradient(120deg, hsla(217, 100%, 50%, 1) 10%, hsla(186, 100%, 69%, 1) 100%)')).toBe('#0062ff')
        expect(toHex(null)).toBe('#fd8738')
    })
})

describe('event card', () => {
    test('overnight event reads as one evening', async () => {
        const card = await buildCard({ event: base })
        expect(texts(card)).toContain('Lørdag 28. november, 17:00–01:00')
        expect(card.banner?.length).toBeGreaterThan(1000)
    })

    test('multi-day, whole-day and no-end time types', async () => {
        const lan = await buildCard({ event: { ...base, time_start: '2026-10-23T17:00:00', time_end: '2026-10-25T14:00:00' } })
        expect(texts(lan)).toContain('Fredag 23. oktober 17:00 – søndag 25. oktober 14:00')

        const wholeDay = { ...base, time_type: 'whole_day', time_start: '2026-03-13T00:00:00', time_end: '2026-03-15T23:59:00' }
        const cabin = await buildCard({ event: wholeDay })
        expect(texts(cabin)).toContain('Fredag 13. mars – søndag 15. mars')

        const meet = await buildCard({ event: { ...base, time_type: 'no_end' } })
        expect(texts(meet)).toContain('Lørdag 28. november, 17:00"')
    })

    test('closed signup hides the button, roles become a mention', async () => {
        const card = await buildCard({
            roles: ['42'],
            event: { ...base, link_signup: 'https://forms.login.no/f/x', time_signup_deadline: '2020-01-01T00:00:00' }
        }, new Date('2026-11-27T12:00:00Z'))
        expect(texts(card)).toContain('Påmeldingen er stengt')
        expect(texts(card)).not.toContain('Meld deg på')
        expect(card.components[0]).toEqual({ type: 10, content: '<@&42>' })
    })

    test('long titles still render a banner', async () => {
        const card = await buildCard({ event: { ...base, name_no: 'Keramikk & Bobler – kreativt, sosialt og skikkelig gøy!' } })
        expect(card.banner?.length).toBeGreaterThan(1000)
    })
})

describe('plain card', () => {
    test('uses own title, description and color', async () => {
        const card = await buildCard({ title: ['Hei', 'Hi'], description: ['Tekst', 'Text'], color: '#f1c40f' })
        expect(card.components[0]).toMatchObject({ type: 17, accent_color: 0xf1c40f })
        expect(texts(card)).toContain('# Hei')
        expect(texts(card)).toContain('-# Text')
    })
})
