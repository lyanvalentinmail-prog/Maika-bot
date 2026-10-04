module.exports = {
  name: 'ping',
  aliases: [],
  category: 'general',
  description: 'Muestra el estado del bot',

  async execute(ctx) {
    await ctx.react('⚡')
    return ctx.reply('─── ׁ ׅ  🏓 *Pong!* El bot está activo  𐔌՞ ܸ.ˬ.ܸ՞𐦯')
  },
}
