const { askAI } = require('../lib/utils')

module.exports = {
  name: 'chatgpt',
  aliases: ['gpt', 'ia', 'ai'],
  category: 'ia',
  description: 'Habla con ChatGPT',
  usage: 'chatgpt <texto>',

  async execute(ctx) {
    const { text, reply, react, settings } = ctx
    if (!text) {
      return reply(
        `✎ Uso: *${settings.prefix}chatgpt* <tu pregunta>\n\n> Ejemplo: ${settings.prefix}chatgpt ¿qué es un agujero negro?`
      )
    }
    await react('🤖')
    try {
      const answer = await askAI(text, 'openai')
      return reply(`•  ≽(˵◝ ⩊  ◜˵ マ≼ \`𝐂𝐡𝐚𝐭𝐆𝐏𝐓\`  ᰨᰍ\n\n${answer.trim()}`)
    } catch (e) {
      return reply(`✖ La IA no respondió. Intenta de nuevo. (${e.message})`)
    }
  },
}
