import config from '#constants'

export default async function alertSlowQuery(duration: number, name: string, ttl = config.CACHE_TTL_HOT) {
    const threshold = ttl / 2000
    if (duration > threshold && config.WEBHOOK_URL) {
        const message = `${name} query took ${duration.toFixed(2)}s, more than half of its ${ttl / 1000}s cache TTL.`
        console.warn(message)

        await fetch(config.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: '🐝 TekKom Bot Slow Query 🐝',
                    description: `🐝 ${message}`,
                    color: 0xff0000,
                    timestamp: new Date().toISOString()
                }]
            })
        })
    }
}
