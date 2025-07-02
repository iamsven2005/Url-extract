export interface ExtractedUrl {
  root: string
  count: number
  originalUrls: string[]
  ipAddress?: string
  ipError?: string
  isResolvingIp?: boolean
  thirdPartyUrls?: Array<{
    url: string
    ipAddress?: string
    ipError?: string
    isResolvingIp?: boolean
  }>
  crawlStatus?: "pending" | "success" | "cors-blocked" | "error"
  crawlError?: string
  isCrawling?: boolean
  redirectInfo?: {
    finalUrl: string
    redirectChain: Array<{
      url: string
      statusCode: number
    }>
    redirectCount: number
  }
  isCheckingRedirect?: boolean
}

export const extractUrlsFromText = (text: string): ExtractedUrl[] => {
  // Enhanced regex to match URLs more accurately
  const urlRegex = /https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?/gi
  const matches = text.match(urlRegex) || []

  console.log(`Found ${matches.length} URL matches in text`)

  // Group URLs by root domain
  const urlGroups: { [key: string]: string[] } = {}

  matches.forEach((url) => {
    try {
      const urlObj = new URL(url)
      const root = `${urlObj.protocol}//${urlObj.hostname}`

      if (!urlGroups[root]) {
        urlGroups[root] = []
      }
      urlGroups[root].push(url)
    } catch (error) {
      console.warn("Invalid URL found:", url)
    }
  })

  // Convert to ExtractedUrl format
  const extractedUrls: ExtractedUrl[] = Object.entries(urlGroups).map(([root, urls]) => ({
    root,
    count: urls.length,
    originalUrls: [...new Set(urls)], // Remove duplicates
  }))

  console.log(`Extracted ${extractedUrls.length} unique root URLs`)

  return extractedUrls
}

export const extractUrlsFromHtml = (html: string, baseUrl: string): string[] => {
  const urls: string[] = []
  const baseUrlObj = new URL(baseUrl)

  // Extract URLs from various HTML attributes
  const patterns = [
    // href attributes
    /href\s*=\s*["']([^"']+)["']/gi,
    // src attributes
    /src\s*=\s*["']([^"']+)["']/gi,
    // action attributes
    /action\s*=\s*["']([^"']+)["']/gi,
    // content attributes (for meta redirects, etc.)
    /content\s*=\s*["'][^"']*url\s*=\s*([^"'\s]+)[^"']*["']/gi,
    // Plain URLs in text content
    /https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?/gi,
  ]

  patterns.forEach((pattern) => {
    let match
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1] || match[0]

      try {
        // Handle relative URLs
        if (url.startsWith("//")) {
          url = baseUrlObj.protocol + url
        } else if (url.startsWith("/")) {
          url = `${baseUrlObj.protocol}//${baseUrlObj.hostname}${url}`
        } else if (!url.startsWith("http")) {
          // Skip non-HTTP URLs (mailto:, javascript:, etc.)
          continue
        }

        const urlObj = new URL(url)

        // Only include external URLs (different domain)
        if (urlObj.hostname !== baseUrlObj.hostname) {
          const rootUrl = `${urlObj.protocol}//${urlObj.hostname}`
          if (!urls.includes(rootUrl)) {
            urls.push(rootUrl)
          }
        }
      } catch (error) {
        // Skip invalid URLs
        continue
      }
    }
  })

  console.log(`Extracted ${urls.length} third-party URLs from HTML`)
  return urls
}
