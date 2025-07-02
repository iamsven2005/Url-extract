export const extractRootUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.hostname}`
  } catch {
    return url
  }
}

export const extractUrlsFromText = (text: string) => {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi
  const matches = text.match(urlRegex) || []

  const urlMap = new Map<string, string>()

  matches.forEach((url) => {
    const cleanUrl = url.replace(/[.,;:!?)]$/, "") // Remove trailing punctuation
    const rootUrl = extractRootUrl(cleanUrl)
    if (!urlMap.has(rootUrl)) {
      urlMap.set(rootUrl, cleanUrl)
    }
  })

  return Array.from(urlMap.entries()).map(([root, original]) => ({
    original,
    root,
  }))
}

export const extractUrlsFromHtml = (html: string, baseUrl: string): string[] => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const urls = new Set<string>()
  const baseDomain = new URL(baseUrl).hostname

  // Extract URLs from various HTML elements
  const selectors = [
    "a[href]",
    "link[href]",
    "script[src]",
    "img[src]",
    "iframe[src]",
    "embed[src]",
    "object[data]",
    "source[src]",
    "track[src]",
    "area[href]",
    "base[href]",
    "form[action]",
  ]

  selectors.forEach((selector) => {
    const elements = doc.querySelectorAll(selector)
    elements.forEach((element) => {
      const url =
        element.getAttribute("href") ||
        element.getAttribute("src") ||
        element.getAttribute("data") ||
        element.getAttribute("action")

      if (url) {
        try {
          const absoluteUrl = new URL(url, baseUrl)
          const domain = absoluteUrl.hostname

          // Only include third-party domains (different from base domain)
          if (domain !== baseDomain && !domain.endsWith(`.${baseDomain}`) && !baseDomain.endsWith(`.${domain}`)) {
            const rootUrl = `${absoluteUrl.protocol}//${domain}`
            urls.add(rootUrl)
          }
        } catch (error) {
          // Invalid URL, skip
        }
      }
    })
  })

  // Also extract URLs from inline styles and script content
  const styleElements = doc.querySelectorAll("style")
  styleElements.forEach((style) => {
    const cssText = style.textContent || ""
    const urlMatches = cssText.match(/url$$['"]?([^'")\s]+)['"]?$$/g)
    if (urlMatches) {
      urlMatches.forEach((match) => {
        const url = match.replace(/url$$['"]?([^'")\s]+)['"]?$$/, "$1")
        try {
          const absoluteUrl = new URL(url, baseUrl)
          const domain = absoluteUrl.hostname
          if (domain !== baseDomain) {
            urls.add(`${absoluteUrl.protocol}//${domain}`)
          }
        } catch (error) {
          // Invalid URL, skip
        }
      })
    }
  })

  return Array.from(urls)
}
