/**
 * Reacciones de anime (API: nekos.best)
 * Un solo plugin registra varios comandos: peek, hug, kiss, pat, slap, poke.
 */

const { fetchJson, fetchBuffer, gifToMp4 } = require('../lib/utils')
const { getMentions, getQuotedParticipant } = require('../lib/message')

const REACTIONS = {
  peek: { accion: 'está espiando a', solo: 'está espiando... 👀' },
  hug: { accion: 'abrazó a', solo: 'quiere un abrazo 🤗' },
  kiss: { accion: 'besó a', solo: 'lanza un besito 😘' },
  pat: { accion: 'acarició a', solo: 'quiere caricias ✋' },
  slap: { accion: 'le dio una cachetada a', solo: 'reparte cachetadas 👋' },
  poke: { accion: 'está molestando a', solo: 'anda molestando 👉' },
}

module.exports = {
  name: 'peek',
  aliases: Object.keys(REACTIONS).filter((n) => n !== 'peek'),
  category: 'anime',
  description: 'Reacciones de anime con mención: #peek #hug #kiss #pat #slap #poke',

  async execute(ctx) {
    const { sock, jid, msg, sender, command, reply, react } = ctx
    await react('❀')

    const info = REACTIONS[command]
    const mentions = getMentions(msg)
    const quoted = getQuotedParticipant(msg)
    const target = mentions[0] || quoted

    const who = `@${sender.split('@')[0]}`
    const caption = target
      ? `❀ ${who} ${info.accion} @${target.split('@')[0]}  ₍ᐢ.  ̫.ᐢ₎`
      : `❀ ${who} ${info.solo}`
    const mentionList = target ? [sender, target] : [sender]

    try {
      const data = await fetchJson(`https://nekos.best/api/v2/${command}`)
      const gifUrl = data?.results?.[0]?.url
      if (!gifUrl) throw new Error('sin resultados')
      const gifBuffer = await fetchBuffer(gifUrl)

      try {
        const mp4 = await gifToMp4(gifBuffer)
        return await sock.sendMessage(
          jid,
          { video: mp4, gifPlayback: true, caption, mentions: mentionList },
          { quoted: msg }
        )
      } catch {
        // sin ffmpeg: enviar como imagen estática
        return await sock.sendMessage(
          jid,
          { image: gifBuffer, caption: `${caption}\n\n> ✎ instala ffmpeg para ver el gif animado`, mentions: mentionList },
          { quoted: msg }
        )
      }
    } catch (e) {
      return reply(`✖ No pude obtener la reacción *${command}*. Intenta de nuevo. (${e.message})`)
    }
  },
}
