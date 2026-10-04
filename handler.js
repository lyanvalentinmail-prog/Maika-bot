/**
 * Manejador de comandos de Maika-Bot.
 * Prefijos aceptados: # . / !
 *
 * Los comandos reales viven como "plugins" en la carpeta /cmds.
 * Este archivo solo se encarga de:
 *   1. Cargar todos los plugins de /cmds.
 *   2. Leer el mensaje entrante y detectar el comando + argumentos.
 *   3. Armar el "ctx" (contexto) y ejecutar el plugin correspondiente.
 */

const fs = require('fs')
const path = require('path')
const settings = require('./settings')
const { getBody } = require('./lib/message')

const PREFIX_REGEX = /^[#./!]/
const CMDS_DIR = path.join(__dirname, 'cmds')

// name/alias (en minúsculas) → plugin
const commands = new Map()

function loadCommands() {
  commands.clear()

  if (!fs.existsSync(CMDS_DIR)) {
    console.warn(`✖ No existe la carpeta de comandos: ${CMDS_DIR}`)
    return
  }

  const files = fs.readdirSync(CMDS_DIR).filter((f) => f.endsWith('.js'))

  for (const file of files) {
    const fullPath = path.join(CMDS_DIR, file)
    try {
      delete require.cache[require.resolve(fullPath)]
      const plugin = require(fullPath)

      if (!plugin?.name || typeof plugin.execute !== 'function') {
        console.warn(`✖ Plugin inválido (sin "name" o "execute"): ${file}`)
        continue
      }

      const names = [plugin.name, ...(plugin.aliases || [])].map((n) => n.toLowerCase())
      for (const n of names) {
        if (commands.has(n)) {
          console.warn(`✖ Comando duplicado "${n}" en ${file} (ya definido en otro plugin)`)
        }
        commands.set(n, plugin)
      }
    } catch (e) {
      console.error(`✖ Error cargando el plugin ${file}:`, e?.message || e)
    }
  }

  console.log(`✎ ${files.length} plugin(s) cargado(s) desde /cmds (${commands.size} comandos registrados)`)
}

loadCommands()

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

  if (!command) return

  const reply = (content) =>
    sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content, { quoted: msg })

  const react = (emoji) =>
    sock.sendMessage(jid, { react: { text: emoji, key: msg.key } }).catch(() => {})

  console.log(`✎ [CMD] ${command} ← ${sender.split('@')[0]}`)

  const plugin = commands.get(command)

  if (!plugin) {
    return reply(`✖ El comando *${settings.prefix}${command}* no existe.\n\n> ✎ Usa *${settings.prefix}menu* para ver la lista de comandos.`)
  }

  const ctx = {
    sock,
    msg,
    jid,
    sender,
    body,
    command,
    args,
    text,
    settings,
    reply,
    react,
  }

  try {
    return await plugin.execute(ctx)
  } catch (e) {
    console.error(`✖ Error ejecutando el comando "${command}":`, e?.message || e)
    return reply(`✖ Ocurrió un error ejecutando *${settings.prefix}${command}*. (${e.message})`)
  }
}

module.exports.commands = commands
module.exports.reload = loadCommands
