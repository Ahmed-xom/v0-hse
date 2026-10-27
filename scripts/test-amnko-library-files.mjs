const baseUrl = process.env.AMNKO_BASE_URL || 'http://localhost:3000'
const cookie = process.env.AMNKO_COOKIE

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function headers() {
  return cookie ? { cookie } : {}
}

const libraryResponse = await fetch(`${baseUrl}/api/amnko-library`, { headers: headers() })
assert(libraryResponse.ok, `Library request failed: HTTP ${libraryResponse.status}`)
const library = await libraryResponse.json()
const document = library.documents?.find((item) => item.pathname && item.fileName)
assert(document, 'No library document with pathname and fileName was returned')

const encodedPathname = encodeURIComponent(document.pathname)
for (const mode of ['preview', 'download']) {
  const suffix = mode === 'download' ? '&download=1' : ''
  const response = await fetch(`${baseUrl}/api/amnko-attachments/file?pathname=${encodedPathname}${suffix}`, {
    headers: headers(),
  })
  const body = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || ''
  const disposition = response.headers.get('content-disposition') || ''
  const expectedFilename = document.fileName.replace(/[\\/]/g, '_')

  assert(response.status === 200, `${mode} failed: HTTP ${response.status}`)
  assert(body.byteLength > 0, `${mode} returned an empty body`)
  assert(contentType && !contentType.includes('undefined'), `${mode} returned an invalid content type`)
  assert(disposition.includes('filename='), `${mode} did not return a filename`) 
  assert(disposition.includes(encodeURIComponent(expectedFilename)) || disposition.includes(`"${expectedFilename}"`), `${mode} returned an unexpected filename`)
  if (mode === 'preview') assert(disposition.startsWith('inline;'), `preview disposition was ${disposition}`)
  if (mode === 'download') assert(disposition.startsWith('attachment;'), `download disposition was ${disposition}`)

  console.log(JSON.stringify({ mode, status: response.status, contentType, dispositionType: disposition.split(';', 1)[0], bytes: body.byteLength }))
}

console.log(JSON.stringify({ checkedPathname: document.pathname, checkedFilename: document.fileName, count: library.documents.length }))
