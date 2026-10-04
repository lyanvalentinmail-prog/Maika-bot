/**
 * Manejador de comandos de Maika-Bot.
 * Prefijos aceptados: # . / !
 */

const { exec } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const settings = require('./settings')
const { buildMenu } = require('./menu')

const PREFIX_REGEX = /^[#./!]/

// Reacciones de anime (API: nekos.best)
const REACTIONS = {
  peek: { accion: 'está espiando a', solo: 'está espiando... 👀' },
  hug: { accion: 'abrazó a', solo: 'quiere un abrazo 🤗' },
  kiss: { accion: 'besó a', solo: 'lanza un besito 😘' },
  pat: { accion: 'acarició a', solo: 'quiere caricias ✋' },
  slap: { accion: 'le dio una cachetada a', solo: 'reparte cachetadas 👋' },
  poke: { accion: 'está molestando a', solo: 'anda molestando 👉' },
}

// ─── utilidades ──────────────────────────────────────────────────

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

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// Convierte un GIF a MP4 con ffmpeg (necesario para que WhatsApp lo anime)
function gifToMp4(gifBuffer) {
  return new Promise((resolve, reject) => {
    const base = path.join(os.tmpdir(), `maika-${Date.now()}`)
    const input = `${base}.gif`
    const output = `${base}.mp4`
    fs.writeFileSync(input, gifBuffer)
    const cmd = `ffmpeg -y -i "${input}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${output}"`
    exec(cmd, (err) => {
      try { fs.unlinkSync(input) } catch {}
      if (err) return reject(err)
      try {
        const buf = fs.readFileSync(output)
        fs.unlinkSync(output)
        resolve(buf)
      } catch (e) {
        reject(e)
      }
    })
  })
}

async function askAI(prompt, model) {
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model}`
  const res = await fetch(url)
  if (!res.ok) {
    // reintento sin modelo específico
    const res2 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`)
    if (!res2.ok) throw new Error(`HTTP ${res2.status}`)
    return res2.text()
  }
  return res.text()
}

// ─── handler principal ───────────────────────────────────────────

module.exports = async function handler(sock, msg) {
  if (!msg.message) return
  const jid = msg.key.remoteJid
  if (!jid || jid === 'status@broadcast') return

  const body = getBody(msg).trim()
  if (!body || !PREFIX_REGEX.test(body)) return

  const sender = msg.key.participant || jid
  const args = body.slice(1).trim().split(/\s+/)
  const command = (args.shift() || '').toLowerCase()
  const text = args.join(' ')

  const reply = (content) =>
    sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content, { quoted: msg })

  const react = (emoji) =>
    sock.sendMessage(jid, { react: { text: emoji, key: msg.key } }).catch(() => {})

  console.log(`✎ [CMD] ${command} ← ${sender.split('@')[0]}`)

  // ── MENÚ ──
  if (['menu', 'menú', 'help', 'ayuda', 'comandos'].includes(command)) {
    await react('📜')
    return reply(buildMenu())
  }

  // ── PING ──
  if (command === 'ping') {
    await react('⚡')
    return reply('─── ׁ ׅ  🏓 *Pong!* El bot está activo  𐔌՞ ܸ.ˬ.ܸ՞𐦯')
  }

  // ── OWNER ──
  if (['owner', 'creador', 'dueño'].includes(command)) {
    await react('👑')
    return reply(
      `─── ׁ ׅ  👑 *Owner*  𐔌՞ ܸ.ˬ.ܸ՞𐦯\n\n❀ ${settings.ownerName}\n❀ wa.me/${settings.ownerNumber}`
    )
  }

  // ── REACCIONES DE ANIME ──
  if (REACTIONS[command]) {
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
  }

  // ── IA: CHATGPT ──
  if (['chatgpt', 'gpt', 'ia', 'ai'].includes(command)) {
    if (!text) return reply(`✎ Uso: *${settings.prefix}chatgpt* <tu pregunta>\n\n> Ejemplo: ${settings.prefix}chatgpt ¿qué es un agujero negro?`)
    await react('🤖')
    try {
      const answer = await askAI(text, 'openai')
      return reply(`•  ≽(˵◝ ⩊  ◜˵ マ≼ \`𝐂𝐡𝐚𝐭𝐆𝐏𝐓\`  ᰨᰍ\n\n${answer.trim()}`)
    } catch (e) {
      return reply(`✖ La IA no respondió. Intenta de nuevo. (${e.message})`)
    }
  }

  // ── IA: GEMINI ──
  if (command === 'gemini') {
    if (!text) return reply(`✎ Uso: *${settings.prefix}gemini* <tu pregunta>\n\n> Ejemplo: ${settings.prefix}gemini escribe un poema corto`)
    await react('✨')
    try {
      const answer = await askAI(text, 'gemini')
      return reply(`•  ≽(˵◝ ⩊  ◜˵ マ≼ \`𝐆𝐞𝐦𝐢𝐧𝐢\`  ᰨᰍ\n\n${answer.trim()}`)
    } catch (e) {
      return reply(`✖ La IA no respondió. Intenta de nuevo. (${e.message})`)
    }
  }

  // ── IA: IMAGINE (texto → imagen) ──
  if (['imagine', 'imagina', 'img'].includes(command)) {
    if (!text) return reply(`✎ Uso: *${settings.prefix}imagine* <descripción>\n\n> Ejemplo: ${settings.prefix}imagine un gato samurái estilo anime`)
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
  }

  // ── comando no encontrado ──
  if (command) {
    return reply(`✖ El comando *${settings.prefix}${command}* no existe.\n\n> ✎ Usa *${settings.prefix}menu* para ver la lista de comandos.`)
  }
}
