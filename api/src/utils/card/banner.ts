import { Resvg } from '@resvg/resvg-js'
import widths from './glyphWidths.json'

export type DateCard = { top: string, big: string, lines: string[] }

const fontFiles = ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf'].map(f => `${import.meta.dir}/fonts/${f}`)
const X = 74
const MAX_W = 840 - 48 - X
const SIZES = [96, 64]

function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

function shade(hex: string, factor: number) {
    return '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0')).join('')
}

function measure(s: string, size: number, w: Record<string, number> = widths.bold) {
    return [...s].reduce((sum, c) => sum + (w[c] ?? 1), 0) * size
}

function fit(title: string): { size: number, lines: string[] } {
    const words = title.split(/\s+/)
    for (const size of SIZES) {
        if (measure(title, size) <= MAX_W) {
            return { size, lines: [title] }
        }

        let best: string[] | null = null
        let bestWidth = Infinity
        for (let i = 1; i < words.length; i++) {
            const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')]
            const width = Math.max(...lines.map(l => measure(l, size)))
            if (width <= MAX_W && width < bestWidth) {
                best = lines
                bestWidth = width
            }
        }

        if (best) {
            return { size, lines: best }
        }
    }

    const size = SIZES[SIZES.length - 1]
    const lines: string[] = []
    for (const word of words) {
        const current = lines[lines.length - 1]
        if (current && measure(`${current} ${word}`, size) <= MAX_W) {
            lines[lines.length - 1] = `${current} ${word}`
        } else {
            lines.push(word)
        }
    }

    const widest = Math.max(...lines.map(l => measure(l, size)))
    return { size: Math.floor(size * Math.min(1, MAX_W / widest)), lines: lines.slice(0, 3) }
}

function text(x: number, y: number, size: number, content: string, attrs = '') {
    return `<text x="${x}" y="${y}" font-family="DejaVu Sans" fill="#fff" font-size="${size}" ${attrs}>${esc(content)}</text>`
}

function stop(offset: string, color: string, opacity: string) {
    return `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`
}

type BannerInput = { title: string, subtitle?: string, color: string, card: DateCard }

export default function renderBanner({ title, subtitle, color, card }: BannerInput) {
    const { size, lines } = fit(title.trim())
    const lineHeight = Math.round(size * 1.08)
    const subSize = subtitle ? Math.min(40, Math.floor(MAX_W / (measure(subtitle, 1, widths.regular) || 1))) : 0
    const block = size * 0.74 + lineHeight * (lines.length - 1) + (subtitle ? subSize + 34 : 0)
    const y0 = Math.round(300 - block / 2 + size * 0.74)
    const c = { x: 840, y: 160, w: 280, h: 280 }
    const cx = c.x + c.w / 2
    const bigSize = Math.min(112, Math.floor(230 / Math.max(measure(card.big, 1), 0.01)))
    const bold = 'font-weight="bold"'
    const center = `${bold} text-anchor="middle"`

    const svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><defs>',
        '<radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="980" cy="300" r="440">',
        stop('0', color, '.75'), stop('.45', color, '.3'), stop('1', color, '0'),
        '</radialGradient><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
        stop('0', '#17171c', '1'), stop('1', shade(color, 0.18), '1'),
        '</linearGradient></defs>',
        '<rect width="1200" height="600" fill="url(#bg)"/><rect width="1200" height="600" fill="url(#glow)"/>',
        `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="28" `
            + 'fill="#fff" fill-opacity=".08" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>',
        text(cx, c.y + 62, 36, card.top, `${center} letter-spacing="5"`),
        text(cx, c.y + 172 - (card.lines.length ? 0 : 20), bigSize, card.big, center),
        ...card.lines.map((l, i) => text(cx, c.y + 214 + i * 38, i ? 30 : 28, l, `${center} letter-spacing="${i ? 0 : 3}"`)),
        ...lines.map((l, i) => text(X, y0 + i * lineHeight, size, l, bold)),
        subtitle ? text(X + 4, y0 + lineHeight * (lines.length - 1) + subSize + 34, subSize, subtitle, 'fill-opacity=".85"') : '',
        '</svg>'
    ].join('')

    return new Resvg(svg, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'DejaVu Sans' } }).render().asPng()
}
