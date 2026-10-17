// 앱 아이콘 PNG 생성 (의존성 없이 Node 내장 zlib 으로 PNG 인코딩) — node scripts/gen-icons.mjs
// 검은 배경 + 흰 "T". 디자인이 나오면 public/ 의 PNG 를 교체하고 이 스크립트는 지워도 됨
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [23, 23, 23] // --primary (#171717)
const FG = [255, 255, 255]

// size×size, T 를 scale 배로 (maskable 은 안전 영역 안에 들어가게 작게)
function icon(size, scale) {
  const s = size / 512
  const c = 256
  // 512 기준 T: 가로 막대 256×64, 세로 기둥 64×240, 전체 높이 240 을 가운데에
  const rects = [
    [128, 136, 384, 200],
    [224, 136, 288, 376],
  ].map(([x0, y0, x1, y1]) => [x0, y0, x1, y1].map((v) => (c + (v - c) * scale) * s))
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0 // 필터 없음
    for (let x = 0; x < size; x++) {
      const inT = rects.some(([x0, y0, x1, y1]) => x + 0.5 >= x0 && x + 0.5 < x1 && y + 0.5 >= y0 && y + 0.5 < y1)
      const [r, g, b] = inT ? FG : BG
      const i = y * (size * 3 + 1) + 1 + x * 3
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
    }
  }
  return png(size, raw)
}

function png(size, raw) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // 8bit
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function crc32(buf) {
  let c = ~0
  for (const byte of buf) {
    c ^= byte
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return ~c >>> 0
}

const out = new URL('../public/', import.meta.url)
writeFileSync(new URL('icon-192.png', out), icon(192, 1))
writeFileSync(new URL('icon-512.png', out), icon(512, 1))
writeFileSync(new URL('icon-maskable-512.png', out), icon(512, 0.75)) // 안드로이드가 원·둥근 사각형으로 잘라도 T 가 남게
writeFileSync(new URL('apple-touch-icon.png', out), icon(180, 1)) // iOS 가 모서리를 직접 둥글게 깎음
