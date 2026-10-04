const { askAI } = require('../lib/utils')

module.exports = {
  name: 'gemini',
  aliases: [],
  category: 'ia',
  description: 'Habla con Gemini',
  usage: 'gemini <texto>',

  async execute(ctx) {
    const { text, reply, react, settings } = ctx
    if (!text) {
      return reply(
        `✎ Uso: *${settings.prefix}gemini* <tu pregunta>\n\n> Ejemplo: ${settings.prefix}gemini escribe un poema corto`
      )
    }
    await react('✨')
    try {
      const answer = await askAI(text, 'gemini')
      return reply(`•  ≽(˵◝ ⩊  ◜˵ マ≼ \`𝐆𝐞𝐦𝐢𝐧𝐢\`  ᰨᰍ\n\n${answer.trim()}`)
    } catch (e) {
      return reply(`✖ La IA no respondió. Intenta de nuevo. (${e.message})`)
    }
  },
}
