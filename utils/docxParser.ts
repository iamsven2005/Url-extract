export const extractTextFromDocx = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Convert binary data to string for URL pattern matching
    // Use a very simple approach - just look for URL patterns in the raw data
    let binaryString = ""
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i])
    }

    // Look for HTTP/HTTPS URLs in the binary data
    // This is a very basic approach but should catch most URLs
    const urlPattern = /https?:\/\/[a-zA-Z0-9][a-zA-Z0-9\-._]*[a-zA-Z0-9][/a-zA-Z0-9\-._~:?#[\]@!$&'()*+,;=%]*/g
    const foundUrls = binaryString.match(urlPattern) || []

    if (foundUrls.length === 0) {
      throw new Error("No URLs found")
    }

    // Clean up the URLs - remove any binary artifacts
    const cleanUrls = foundUrls
      .map((url) => {
        // Remove any non-printable characters that might have been picked up
        return url.replace(/[\x00-\x1F\x7F-\xFF]/g, "")
      })
      .filter((url) => {
        // Basic validation - must be a reasonable length and contain a dot
        return url.length > 8 && url.includes(".") && !url.includes(" ")
      })
      .filter((url, index, array) => {
        // Remove duplicates
        return array.indexOf(url) === index
      })

    if (cleanUrls.length === 0) {
      throw new Error("No valid URLs found")
    }

    return cleanUrls.join("\n")
  } catch (error) {
    // Don't throw complex errors, just indicate no URLs found
    throw new Error("No URLs found")
  }
}

export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Similar simple approach for PDFs
    let binaryString = ""
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i])
    }

    const urlPattern = /https?:\/\/[a-zA-Z0-9][a-zA-Z0-9\-._]*[a-zA-Z0-9][/a-zA-Z0-9\-._~:?#[\]@!$&'()*+,;=%]*/g
    const foundUrls = binaryString.match(urlPattern) || []

    if (foundUrls.length === 0) {
      throw new Error("No URLs found")
    }

    const cleanUrls = foundUrls
      .map((url) => url.replace(/[\x00-\x1F\x7F-\xFF]/g, ""))
      .filter((url) => url.length > 8 && url.includes(".") && !url.includes(" "))
      .filter((url, index, array) => array.indexOf(url) === index)

    if (cleanUrls.length === 0) {
      throw new Error("No valid URLs found")
    }

    return cleanUrls.join("\n")
  } catch (error) {
    throw new Error("No URLs found")
  }
}
