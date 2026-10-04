/**
 * Utilidades generales: peticiones HTTP, conversión de gifs e IA.
 */

const { exec } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

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

module.exports = { fetchJson, fetchBuffer, gifToMp4, askAI }
