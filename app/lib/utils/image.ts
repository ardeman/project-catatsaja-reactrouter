// HEIC/HEIF photos (iPhone's default) can be read by Gemini as they are.
const heicType = (file: Blob) => {
  const name = file instanceof File ? file.name.toLowerCase() : ''
  return ['heic', 'heif']
    .map((format) => ({ format, mimeType: `image/${format}` }))
    .find(
      ({ format, mimeType }) =>
        file.type === mimeType || name.endsWith(`.${format}`),
    )?.mimeType
}

// Below Gemini's inline request limit (20 MB, which counts base64).
const maxRawBytes = 14 * 1024 * 1024

const toBase64 = async (file: Blob) => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x80_00)
    binary += String.fromCodePoint(...bytes.subarray(index, index + 0x80_00))
  return btoa(binary)
}

// Shrinks a photo before it is sent anywhere: at most `maxSide` pixels on
// its longest side, as JPEG, returned as base64 without the data: prefix.
// A phone photo of 4–12 MB becomes a few hundred kB, which is faster to
// send and still sharp enough to read. A HEIC photo the browser can't
// decode (Chrome, Firefox) is sent as it is.
export const shrinkImage = async (file: Blob, maxSide = 1600) => {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch (error) {
    const mimeType = heicType(file)
    if (!mimeType || file.size > maxRawBytes) throw error
    return { mimeType, data: await toBase64(file) }
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return {
    mimeType: 'image/jpeg',
    data: dataUrl.slice(dataUrl.indexOf(',') + 1),
  }
}
