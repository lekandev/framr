// Wraps @imgly/background-removal (client-side, no API key needed)
// Install: npm i @imgly/background-removal

let removeLib = null

const getLib = async () => {
  if (!removeLib) {
    removeLib = await import('@imgly/background-removal')
  }
  return removeLib
}

/**
 * Takes a data URL or File, returns a data URL with background removed.
 * @param {string | File} input
 * @returns {Promise<string>} data URL (PNG with transparency)
 */
export async function removeBackground(input) {
  const lib = await getLib()

  const blob = typeof input === 'string'
    ? await (await fetch(input)).blob()
    : input

  const resultBlob = await lib.removeBackground(blob, {
    publicPath: '/bg-removal/', // put the WASM assets here (see README)
    progress: () => {},         // optionally wire up a progress callback
  })

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(resultBlob)
  })
}
