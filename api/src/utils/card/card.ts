import config from '#constants'
import renderBanner, { type DateCard } from './banner.ts'

export type WorkerbeeEvent = {
    id?: number
    name_no: string
    name_en?: string | null
    description_no?: string | null
    description_en?: string | null
    informational_no?: string | null
    time_type?: string | null
    time_start: string
    time_end: string
    time_signup_release?: string | null
    time_signup_deadline?: string | null
    canceled?: boolean
    link_signup?: string | null
    link_discord?: string | null
    link_stream?: string | null
    image_banner?: string | null
    capacity?: number | null
    is_full?: boolean
    category?: { name_no?: string, color?: string | null } | null
    location?: {
        name_no?: string | null
        name_en?: string | null
        type?: string | null
        url?: string | null
        address_street?: string | null
        mazemap_campus_id?: number | null
        mazemap_poi_id?: number | null
    } | null
    rule?: { name_no?: string | null, description_no?: string | null } | null
    organization?: { name_no?: string | null } | null
}

export type CardInput = {
    title?: string[]
    description?: string[]
    roles?: string[] | null
    color?: string | null
    event?: WorkerbeeEvent | null
}

type Component = Record<string, unknown>
export type Card = { components: Component[], banner?: Buffer }

export const BANNER_NAME = 'banner.png'
const ORANGE = '#fd8738'
const TZ = { timeZone: 'Europe/Oslo' } as const
const LINE = { type: 14, divider: true, spacing: 2 }
const GAP = { type: 14, divider: false, spacing: 2 }

export async function getEvent(id: number | string) {
    const res = await fetch(`${config.WORKERBEE_API_URL}/events/${id}`)
    if (!res.ok) {
        throw new Error(`Workerbee event ${id}: ${res.status}`)
    }

    return await res.json() as WorkerbeeEvent
}

export default async function buildCard(input: CardInput, now = new Date()): Promise<Card> {
    const mention = input.roles?.filter(Boolean).map(id => `<@&${id}>`).join(' ')
    const card = input.event ? await eventCard(input.event, now) : plainCard(input)
    if (mention) {
        card.components.unshift({ type: 10, content: mention })
    }

    return card
}

export function oslo(time: string) {
    const d = new Date(time.replace(/Z$/, '') + 'Z')
    const offset = +new Date(d.toLocaleString('en-US', TZ)) - +new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }))
    return new Date(+d - offset)
}

export function toHex(css?: string | null): string {
    if (!css) {
        return ORANGE
    }

    const hex = css.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i)?.[1] ?? css.match(/^([0-9a-f]{6})$/i)?.[1]
    if (hex) {
        return '#' + (hex.length === 3 ? [...hex].map(c => c + c).join('') : hex).toLowerCase()
    }

    const rgb = css.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
    if (rgb) {
        return '#' + rgb.slice(1, 4).map(n => (+n).toString(16).padStart(2, '0')).join('')
    }

    const hsl = css.match(/hsla?\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i)
    if (hsl) {
        const [h, s, l] = [+hsl[1], +hsl[2] / 100, +hsl[3] / 100]
        const f = (n: number) => {
            const k = (n + h / 30) % 12
            return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
        }
        return '#' + [0, 8, 4].map(n => Math.round(f(n) * 255).toString(16).padStart(2, '0')).join('')
    }

    return ORANGE
}

function plainCard({ title = [], description = [], color }: CardInput): Card {
    const [titleNo, titleEn] = title.map(clean)
    const [descNo, descEn] = description.map(clean)
    const components: Component[] = []
    if (titleNo) components.push({ type: 10, content: `# ${titleNo}` })
    if (descNo) components.push({ type: 10, content: clip(descNo, 3000) })
    if (titleEn || descEn) {
        components.push(LINE, { type: 10, content: small(titleEn, descEn) })
    }

    return { components: [{ type: 17, accent_color: hexToInt(toHex(color)), components }] }
}

async function eventCard(e: WorkerbeeEvent, now: Date): Promise<Card> {
    const start = oslo(e.time_start)
    const end = oslo(e.time_end)
    const color = toHex(e.category?.color)
    const loc = place(e.location)
    const time = when(e.time_type, start, end)
    const title = clean(e.name_no) || clean(e.name_en)

    const image = await usableImage(e.image_banner)
    const banner = image ? undefined : Buffer.from(renderBanner({ title, subtitle: loc?.name, color, card: time.card }))

    const info = [`### 🗓️  ${time.text}`]
    if (loc) info.unshift(`### 📍  ${loc.full}`)
    const org = e.organization?.name_no?.trim()
    if (org && !loc?.name.toLowerCase().includes(org.toLowerCase())) info.push(`### 🏢  ${org}`)

    const deadline = e.time_signup_deadline ? oslo(e.time_signup_deadline) : null
    const release = e.time_signup_release ? oslo(e.time_signup_release) : null
    const signupOpen = !!e.link_signup && !(deadline && deadline < now)
    const extra: string[] = []
    if (e.link_signup) {
        if (!signupOpen) extra.push('Påmeldingen er stengt')
        else if (e.is_full) extra.push('Fullt – det kan være venteliste')
        else if (release && release > now) extra.push(`Påmelding åpner ${dayLong(release).toLowerCase()} kl. ${hm(release)}`)
        else if (deadline) extra.push(`Påmeldingsfrist ${dayLong(deadline).toLowerCase()} kl. ${hm(deadline)}`)
    }
    if (e.capacity) extra.push(`${e.capacity} plasser`)
    if (extra.length) info.push(`-# ${extra.join(' · ')}`)

    const rules = clean(e.rule?.description_no)
    const informational = clean(e.informational_no)
    const buttons = [
        ...(signupOpen && e.link_signup ? [link(e.is_full ? 'Venteliste' : 'Meld deg på', e.link_signup, '✍️')] : []),
        ...(e.id ? [link('Se arrangement', `https://login.no/events/${e.id}`)] : []),
        ...(loc?.url ? [link('Kart', loc.url, '🗺️')] : []),
        ...(e.link_discord ? [link('Discord', e.link_discord)] : []),
        ...(e.link_stream ? [link('Stream', e.link_stream, '📺')] : []),
    ].slice(0, 5)

    const components: Component[] = [
        { type: 12, items: [{ media: { url: image ?? `attachment://${BANNER_NAME}` } }] },
        { type: 10, content: `# ${e.canceled ? '❌ AVLYST – ' : ''}${title}` },
    ]
    if (clean(e.description_no)) components.push({ type: 10, content: clip(clean(e.description_no), 1800) })
    if (informational) components.push({ type: 10, content: clip(informational, 400).split('\n').map(l => `> ${l}`).join('\n') })
    if (rules) components.push({ type: 10, content: `**${e.rule?.name_no?.trim() || 'Regler'}**\n${clip(rules, 600)}` })
    components.push(LINE, { type: 10, content: info.join('\n') })
    if (clean(e.description_en)) {
        components.push(LINE, { type: 10, content: small(clean(e.name_en) || title, clean(e.description_en), 300) })
    }
    if (buttons.length) components.push(GAP, { type: 1, components: buttons })

    return {
        components: [{ type: 17, accent_color: hexToInt(e.canceled ? '#d62f43' : color), components }],
        banner,
    }
}

function when(type: string | null | undefined, start: Date, end: Date): { text: string, card: DateCard } {
    const sameDay = ymd(start) === ymd(end)
    const overnight = !sameDay && +end - +start < 864e5 && Number(end.toLocaleString('en-GB', { ...TZ, hour: '2-digit' })) < 7
    const multi = !sameDay && !overnight
    const month = part(start, { month: 'short' })
    const day = (d: Date) => part(d, { day: 'numeric' })
    const weekday = (d: Date) => part(d, { weekday: 'long' })
    const wk = (d: Date) => part(d, { weekday: 'short' })
    const range = { top: month, big: `${day(start)}–${day(end)}`, lines: [`${wk(start)}–${wk(end)}`] }
    const single = { top: month, big: day(start), lines: [weekday(start)] }

    if (type === 'to_be_determined') {
        return { text: 'Tidspunkt kommer', card: { top: month, big: '?', lines: ['KOMMER'] } }
    }

    if (type === 'whole_day') {
        return multi
            ? { text: `${dayLong(start)} – ${dayLong(end).toLowerCase()}`, card: range }
            : { text: dayLong(start), card: single }
    }

    if (type === 'no_end') {
        return { text: `${dayLong(start)}, ${hm(start)}`, card: { ...single, lines: [...single.lines, hm(start)] } }
    }

    if (multi) {
        const text = `${dayLong(start)} ${hm(start)} – ${dayLong(end).toLowerCase()} ${hm(end)}`
        return { text, card: { ...range, lines: [...range.lines, hm(start)] } }
    }

    return { text: `${dayLong(start)}, ${hm(start)}–${hm(end)}`, card: { ...single, lines: [...single.lines, hm(start)] } }
}

function place(loc: WorkerbeeEvent['location']) {
    const name = loc?.name_no?.trim() || loc?.name_en?.trim()
    if (!loc || !name) {
        return null
    }

    const url = loc.type === 'mazemap' && loc.mazemap_poi_id
        ? `https://use.mazemap.com/#v=1&campusid=${loc.mazemap_campus_id}&sharepoitype=poi&sharepoi=${loc.mazemap_poi_id}`
        : loc.url || null
    return { name, full: loc.address_street ? `${name}, ${loc.address_street.trim()}` : name, url }
}

async function usableImage(file?: string | null) {
    if (!file) {
        return null
    }

    const url = `${config.CDN_URL}/img/events/${encodeURIComponent(file)}`
    const res = await fetch(url, { method: 'HEAD' }).catch(() => null)
    return res?.ok && Number(res.headers.get('content-length') ?? 0) >= 2048 ? url : null
}

function small(title?: string, text?: string, max = 600) {
    const body = (text ?? '').replace(/\s*\n+\s*/g, ' ')
    return [title && `**🇬🇧 ${title}**`, body && `-# ${clip(body, max)}`].filter(Boolean).join('\n')
}

function link(label: string, url: string, emoji?: string) {
    return { type: 2, style: 5, label, url, ...(emoji ? { emoji: { name: emoji } } : {}) }
}

function clean(s?: string | null) {
    return (s ?? '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

function clip(s: string, max: number) {
    if (s.length <= max) {
        return s
    }

    const cut = s.lastIndexOf(' ', max - 1)
    return s.slice(0, cut > max * 0.6 ? cut : max - 1) + '…'
}

function hexToInt(hex: string) {
    return parseInt(hex.slice(1), 16)
}

function cap(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function dayLong(d: Date) {
    return cap(d.toLocaleDateString('nb-NO', { ...TZ, weekday: 'long', day: 'numeric', month: 'long' }))
}

function hm(d: Date) {
    return d.toLocaleTimeString('nb-NO', { ...TZ, hour: '2-digit', minute: '2-digit' })
}

function part(d: Date, options: Intl.DateTimeFormatOptions) {
    return d.toLocaleString('nb-NO', { ...TZ, ...options }).replace('.', '').toUpperCase()
}

function ymd(d: Date) {
    return d.toLocaleDateString('sv-SE', TZ)
}
