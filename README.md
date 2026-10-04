# ─── ׁ ׅ  𝐌ᴀɪᴋᴀ - 𝐁ᴏᴛ  𐔌՞ ܸ.ˬ.ܸ՞𐦯

Bot de WhatsApp hecho con **Baileys**, listo para ejecutarse en **Termux**.
Se puede vincular por **código QR** o por **Pairing Code** (código de 8 dígitos).

## ✎ Comandos

| Comando | Descripción |
|---|---|
| `#menu` | Muestra el menú del bot |
| `#peek @usuario` | Espiar a alguien (gif anime) |
| `#hug` `#kiss` `#pat` `#slap` `#poke` | Reacciones de anime con mención |
| `#chatgpt <texto>` | Habla con ChatGPT |
| `#gemini <texto>` | Habla con Gemini |
| `#imagine <texto>` | Crea una imagen con IA |
| `#ping` / `#owner` | Estado del bot / contacto del dueño |

También acepta los prefijos `.` `/` `!`

## ✎ Instalación en Termux

```bash
# 1. Actualizar Termux e instalar lo necesario
pkg update -y && pkg upgrade -y
pkg install -y nodejs git ffmpeg

# 2. Clonar el repositorio
git clone https://github.com/lyanvalentinmail-prog/Maika-bot
cd Maika-bot

# 3. Instalar dependencias
npm install

# 4. Iniciar el bot
npm start
```

> ✎ `ffmpeg` es opcional pero recomendado: hace que los gifs de anime
> se envíen animados. Sin él se envían como imagen estática.

## ✎ Vincular el bot

Al iniciar por primera vez el bot pregunta:

```
✎ ¿Cómo quieres vincular el bot?

   1 ❀ Código QR (escanear con el teléfono)
   2 ❀ Pairing Code (código de 8 dígitos)
```

- **Opción 1 (QR):** aparece un QR en la terminal. En WhatsApp ve a
  *Dispositivos vinculados → Vincular dispositivo* y escanéalo.
- **Opción 2 (Pairing Code):** escribe tu número con código de país
  (ej. `5215512345678`). El bot te da un código tipo `ABCD-EFGH`.
  En WhatsApp: *Dispositivos vinculados → Vincular dispositivo →
  Vincular con el número de teléfono* y escribe el código.

La sesión se guarda en la carpeta `session/`, así que solo necesitas
vincular una vez. Para cerrar sesión borra esa carpeta: `rm -rf session`.

## ✎ Estructura del proyecto

```
Maika-bot/
├── index.js            # arranque y conexión con WhatsApp (Baileys)
├── handler.js          # carga los plugins de /cmds y despacha los comandos
├── menu.js             # texto del menú (#menu)
├── settings.js         # configuración del bot
├── lib/
│   ├── message.js       # utilidades para leer el mensaje (texto, menciones, citado)
│   └── utils.js          # fetch helpers, conversión gif→mp4, llamadas a IA
└── cmds/                # ✎ AQUÍ VIVEN TODOS LOS PLUGINS/COMANDOS
    ├── menu.js
    ├── ping.js
    ├── owner.js
    ├── anime-reacciones.js   # #peek #hug #kiss #pat #slap #poke
    ├── chatgpt.js
    ├── gemini.js
    └── imagine.js
```

### Cómo crear un comando nuevo

Cada archivo dentro de `cmds/` exporta un objeto "plugin". No hay que tocar
`handler.js`: basta con crear el archivo y el bot lo carga solo al iniciar.

```js
// cmds/saludo.js
module.exports = {
  name: 'saludo',           // comando principal: #saludo
  aliases: ['hola'],        // alias opcionales: #hola
  category: 'general',      // solo informativo, para organizar
  description: 'Saluda a quien escriba el comando',

  async execute(ctx) {
    // ctx incluye: sock, msg, jid, sender, command, args, text,
    //              settings, reply(contenido), react(emoji)
    await ctx.react('👋')
    return ctx.reply('¡Hola! 👋')
  },
}
```

> ✎ Si necesitas lógica compartida entre varios comandos (como las
> peticiones HTTP o la conversión de gifs), agrégala en `lib/` y
> impórtala desde tu plugin con `require('../lib/utils')`.

## ✎ Configuración

Edita `settings.js` para personalizar:

```js
botName: '𝐌ᴀɪᴋᴀ',          // nombre del bot (aparece en el menú)
botType: '𝐁ᴏᴛ - 𝐌𝐃',       // tipo del bot
prefix: '#',                // prefijo principal
ownerName: 'Lyan',          // tu nombre
ownerNumber: '0000000000',  // tu número
enlace: '...',              // enlace del grupo/canal oficial
developer: '...',           // contacto del developer
web: '...',                 // web oficial para sub-bots
```

## ✎ Mantener el bot encendido en Termux

```bash
# Evitar que Android mate el proceso
termux-wake-lock
npm start
```
