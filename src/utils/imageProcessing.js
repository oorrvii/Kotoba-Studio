export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_INPUT_BYTES = 20 * 1024 * 1024
const FULL = { maxSide: 1280, maxBytes: 800_000 }
const THUMB = { maxSide: 240, maxBytes: 45_000 }

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))

async function encode(bitmap, { maxSide, maxBytes }) {
  let side = maxSide
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)

    for (const quality of [0.85, 0.75, 0.65, 0.5, 0.4]) {
      let blob = await toBlob(canvas, 'image/webp', quality)
      if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality)
      if (blob && blob.size <= maxBytes) return { blob, width, height, contentType: blob.type }
    }
    side = Math.round(side * 0.8)
  }
  throw new Error('This image is too detailed to compress. Try a smaller or simpler picture.')
}

export async function processImage(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error('Use a JPG, PNG or WebP image.')
  if (file.size > MAX_INPUT_BYTES) throw new Error('This image is larger than 20 MB. Choose a smaller file.')
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This image couldn’t be read. Try a different file.')
  }
  try {
    return { full: await encode(bitmap, FULL), thumb: await encode(bitmap, THUMB) }
  } finally {
    bitmap.close?.()
  }
}

export async function createThumbnail(blob) {
  const bitmap = await createImageBitmap(blob)
  try {
    return await encode(bitmap, THUMB)
  } finally {
    bitmap.close?.()
  }
}
