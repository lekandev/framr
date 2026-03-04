let removeLib = null

export async function removeBackground(input) {
  if (!removeLib) removeLib = await import('@imgly/background-removal')

  const blob = typeof input === 'string'
    ? await (await fetch(input)).blob()
    : input

  // No publicPath — lib resolves its own bundled assets via import.meta.url
  const resultBlob = await removeLib.removeBackground(blob)

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(resultBlob)
  })
}