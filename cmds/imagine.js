const { fetchBuffer } = require('../lib/utils')

module.exports = {
  name: 'imagine',
  aliases: ['imagina', 'img'],
  category: 'ia',
  description: 'Crea una imagen con IA a partir de una descripción',
  usage: 'imagine <descripción>',

  async execute(ctx) {
    const { sock, jid, msg, text, reply, react, settings } = ctx
    if (!text) {
      return reply(
        `✎ Uso: *${settings.prefix}imagine* <descripción>\n\n> Ejemplo: ${settings.prefix}imagine un gato samurái estilo anime`
      )
    }
    await react('🎨')
    await reply('✎ ᴄʀᴇᴀɴᴅᴏ ᴛᴜ ɪᴍᴀɢᴇɴ... 𐔌՞ ܸ.ˬ.ܸ՞𐦯')
    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=1024&height=1024&nologo=true`
      const image = await fetchBuffer(url)
      return await sock.sendMessage(
        jid,
        { image, caption: `❀ \`𝐈𝐦𝐚𝐠𝐢𝐧𝐞\`  ᰨᰍ\n\n> ✎ ${text}` },
        { quoted: msg }
      )
    } catch (e) {
      return reply(`✖ No pude generar la imagen. Intenta de nuevo. (${e.message})`)
    }
  },
}
