// Shrinks a photo before it is sent anywhere: at most `maxSide` pixels on
// its longest side, as JPEG, returned as base64 without the data: prefix.
// A phone photo of 4–12 MB becomes a few hundred kB, which is faster to
// send and still sharp enough to read.
export const shrinkImage = async (file: Blob, maxSide = 1600) => {
  const bitmap = await createImageBitmap(file)
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
