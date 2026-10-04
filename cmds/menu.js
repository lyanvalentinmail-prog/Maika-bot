const { buildMenu } = require('../menu')

module.exports = {
  name: 'menu',
  aliases: ['menú', 'help', 'ayuda', 'comandos'],
  category: 'general',
  description: 'Muestra el menú de comandos del bot',

  async execute(ctx) {
    await ctx.react('📜')
    return ctx.reply(buildMenu())
  },
}
