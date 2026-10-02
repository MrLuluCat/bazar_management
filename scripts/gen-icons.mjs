// Generates the PWA icons (no dependencies): green ground, paper "ticket stub" with a dashed perforation.
// Usage: node scripts/gen-icons.mjs
import { deflateSync, crc32 } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const GREEN = [31, 107, 80]
const PAPER = [248, 244, 236]
const OUT = path.resolve(import.meta.dirname, '../web/public/icons')

function png(size, scale) {
  const px = Buffer.alloc(size * size * 3)
  const half = (size * scale) / 2
  const c = size / 2
  const r = size * 0.06
  const perf = c - half + half * 2 * 0.3
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let col = GREEN
      const dx = Math.abs(x - c)
      const dy = Math.abs(y - c)
      // Rounded rectangle test.
      const inside = dx <= half && dy <= half && !(dx > half - r && dy > half - r && Math.hypot(dx - (half - r), dy - (half - r)) > r)
      if (inside) {
        col = PAPER
        const onPerf = Math.abs(x - perf) < size * 0.008 && (Math.floor((y - (c - half)) / (size * 0.035)) % 2 === 0)
        if (onPerf) col = GREEN
        // Two ledger lines right of the perforation.
        const rel = (y - (c - half)) / (half * 2)
        const relx = (x - (c - half)) / (half * 2)
        if (relx > 0.4 && relx < 0.85 && (Math.abs(rel - 0.4) < 0.025 || Math.abs(rel - 0.6) < 0.025)) col = GREEN
      }
      const i = (y * size + x) * 3
      px[i] = col[0]
      px[i + 1] = col[1]
      px[i + 2] = col[2]
    }
  }
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3)
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(td) >>> 0)
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

mkdirSync(OUT, { recursive: true })
writeFileSync(path.join(OUT, 'icon-192.png'), png(192, 0.72))
writeFileSync(path.join(OUT, 'icon-512.png'), png(512, 0.72))
writeFileSync(path.join(OUT, 'icon-maskable-512.png'), png(512, 0.5)) // content inside the 80% safe zone
writeFileSync(path.join(OUT, 'apple-touch-icon.png'), png(180, 0.72))
console.log('icons written to', OUT)
