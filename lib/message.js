/**
 * Utilidades para leer datos de un mensaje de Baileys.
 */

function getBody(msg) {
  const m = msg.message
  if (!m) return ''
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    ''
  )
}

function getMentions(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
}

function getQuotedParticipant(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.participant || null
}

module.exports = { getBody, getMentions, getQuotedParticipant }
