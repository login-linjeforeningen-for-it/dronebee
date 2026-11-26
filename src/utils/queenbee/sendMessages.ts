import { Client, MessageFlags, TextChannel } from 'discord.js'
import type { APIMessageTopLevelComponent } from 'discord.js'

export default async function sendMessages(client: Client, messages: Announcement[]) {
    const sent = []
    for (const message of messages) {
        const channel = client.channels.cache.get(message.channel)
        if (!channel || !channel.isTextBased()) {
            console.warn(`Channel ${message.channel} not found or not a text channel.`)
            continue
        }

        const textChannel = channel as TextChannel
        try {
            if (message.components?.length) {
                await textChannel.send({
                    flags: MessageFlags.IsComponentsV2,
                    components: message.components as APIMessageTopLevelComponent[],
                    files: message.banner ? [{ attachment: Buffer.from(message.banner, 'base64'), name: 'banner.png' }] : []
                })
                sent.push(message)
                continue
            }

            const roles = message.roles?.length > 0 ? message.roles.map((role) => `<@&${role}> `).join('') : ''
            const text = message.title.map((title, i) => `**${title}**\n${message.description[i] ?? ''}\n`).join('')
            const content = roles + text
            if (content.trim().length > 0) {
                await textChannel.send(content)
            }
            sent.push(message)
        } catch (error) {
            console.log(`Error while sending messages: ${error}`)
        }
    }

    return sent
}
