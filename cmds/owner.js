module.exports = {
  name: 'owner',
  aliases: ['creador', 'dueño'],
  category: 'general',
  description: 'Muestra el contacto del dueño del bot',

  async execute(ctx) {
    await ctx.react('👑')
    return ctx.reply(
      `─── ׁ ׅ  👑 *Owner*  𐔌՞ ܸ.ˬ.ܸ՞𐦯\n\n❀ ${ctx.settings.ownerName}\n❀ wa.me/${ctx.settings.ownerNumber}`
    )
  },
}
