// Shrink a photo on the device before saving, so it fits comfortably in the
// free database: a full image (longest side 1280px) and a small thumbnail.
const MAX_FULL_CHARS = 700_000 // stays well under Firestore's 1 MiB document limit

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file couldn’t be opened as a photo.')) }
    img.src = url
  })
}

function draw(img, maxSide, square) {
  const w = img.naturalWidth, h = img.naturalHeight
  const c = document.createElement('canvas')
  if (square) {
    // center-crop to a square for thumbnails
    const side = Math.min(w, h)
    c.width = c.height = maxSide
    c.getContext('2d').drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, maxSide, maxSide)
  } else {
    const scale = Math.min(1, maxSide / Math.max(w, h))
    c.width = Math.round(w * scale); c.height = Math.round(h * scale)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  }
  return c
}

export async function preparePhoto(file) {
  const img = await loadImage(file)
  let side = 1280, q = 0.8, full
  // step quality, then size, down until it fits
  for (let i = 0; i < 8; i++) {
    full = draw(img, side, false).toDataURL('image/jpeg', q)
    if (full.length <= MAX_FULL_CHARS) break
    if (q > 0.6) q -= 0.1
    else side = Math.round(side * 0.8)
  }
  const thumb = draw(img, 160, true).toDataURL('image/jpeg', 0.72)
  return { full, thumb, bytes: Math.round((full.length * 3) / 4) }
}
