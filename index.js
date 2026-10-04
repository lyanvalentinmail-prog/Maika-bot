/**
 * ─── ׁ ׅ  𝐌ᴀɪᴋᴀ - 𝐁ᴏᴛ  𐔌՞ ܸ.ˬ.ܸ՞𐦯
 * Bot de WhatsApp con Baileys para Termux.
 * Soporta conexión por código QR y por Pairing Code (código de 8 dígitos).
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const readline = require('readline')
const fs = require('fs')
const settings = require('./settings')
const handler = require('./handler')

const logger = pino({ level: 'silent' })

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

let usePairingCode = false
let pairingNumber = null
let methodChosen = false

function banner() {
  console.log(`
─── ׁ ׅ  ${settings.botName} (${settings.botType})  𐔌՞ ܸ.ˬ.ܸ՞𐦯
✎ ʙᴏᴛ ᴅᴇ ᴡʜᴀᴛsᴀᴘᴘ ᴄᴏɴ ʙᴀɪʟᴇʏs ᴘᴀʀᴀ ᴛᴇʀᴍᴜx
︵𝆣᷼ ͡︵᷼𝆣 ᷼͡︵᷼𝆣 ᷼͡︵ ᅟິᅟᅟ︵𝆣᷼ ͡︵᷼𝆣 ᷼͡︵᷼𝆣 ᷼͡︵
`)
}

async function chooseMethod() {
  if (methodChosen) return
  methodChosen = true

  // Si no hay terminal interactiva, usar QR por defecto
  if (!process.stdin.isTTY) {
    usePairingCode = false
    console.log('✎ Terminal no interactiva: usando método QR por defecto.\n')
    return
  }

  console.log('✎ ¿Cómo quieres vincular el bot?\n')
  console.log('   1 ❀ Código QR (escanear con el teléfono)')
  console.log('   2 ❀ Pairing Code (código de 8 dígitos)\n')

  let option = ''
  while (!['1', '2'].includes(option)) {
    option = (await question('──❀ Elige 1 o 2: ')).trim()
  }

  usePairingCode = option === '2'

  if (usePairingCode) {
    let num = ''
    while (!/^\d{7,15}$/.test(num)) {
      num = (await question('\n──❀ Escribe tu número de WhatsApp (con código de país, solo dígitos)\n    Ejemplo: 5215512345678\n──❀ Número: '))
        .trim()
        .replace(/\D/g, '')
    }
    pairingNumber = num
  }
  console.log('')
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(settings.sessionDir)

  let version
  try {
    const latest = await fetchLatestBaileysVersion()
    version = latest.version
  } catch {
    version = undefined // usa la versión por defecto de Baileys
  }

  const registered = state.creds.registered

  if (!registered) await chooseMethod()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    auth: state,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
  })

  // ── Pairing Code ──────────────────────────────────────────────
  if (!registered && usePairingCode && pairingNumber) {
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(pairingNumber)
        code = code?.match(/.{1,4}/g)?.join('-') || code
        console.log('\n︵𝆣᷼ ͡︵᷼𝆣 ᷼͡︵᷼𝆣 ᷼͡︵')
        console.log(`\n   ❀ Tu Pairing Code es:  ${code}\n`)
        console.log('   ✎ En WhatsApp: Dispositivos vinculados →')
        console.log('     Vincular dispositivo → Vincular con número\n')
        console.log('︵𝆣᷼ ͡︵᷼𝆣 ᷼͡︵᷼𝆣 ᷼͡︵\n')
      } catch (e) {
        console.error('✖ Error solicitando el pairing code:', e?.message || e)
      }
    }, 3000)
  }

  // ── Eventos de conexión ───────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && !usePairingCode) {
      console.log('\n✎ Escanea este código QR con WhatsApp:')
      console.log('  (WhatsApp → Dispositivos vinculados → Vincular dispositivo)\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log(`\n─── ׁ ׅ  ✅ ${settings.botName} conectado a WhatsApp  𐔌՞ ܸ.ˬ.ܸ՞𐦯`)
      console.log(`✎ Número: ${sock.user?.id?.split(':')[0] || 'desconocido'}`)
      console.log(`✎ Prefijo de comandos: ${settings.prefix}   (prueba ${settings.prefix}menu)\n`)
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const loggedOut = statusCode === DisconnectReason.loggedOut

      if (loggedOut) {
        console.log('\n✖ Sesión cerrada desde el teléfono. Borrando credenciales...')
        try { fs.rmSync(settings.sessionDir, { recursive: true, force: true }) } catch {}
        console.log('✎ Vuelve a iniciar con: npm start\n')
        process.exit(0)
      } else {
        console.log(`\n⟳ Conexión cerrada (código ${statusCode || '??'}). Reconectando en 5s...\n`)
        setTimeout(() => startBot(), 5000)
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // ── Mensajes entrantes ────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      try {
        await handler(sock, msg)
      } catch (e) {
        console.error('✖ Error en el handler:', e?.message || e)
      }
    }
  })

  return sock
}

banner()
startBot().catch((e) => {
  console.error('✖ Error fatal al iniciar:', e)
  process.exit(1)
})
