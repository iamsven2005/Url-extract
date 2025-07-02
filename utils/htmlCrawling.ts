import { extractUrlsFromHtml } from "./urlExtraction"
import type { ThirdPartyUrl } from "../types"

export const crawlPage = async (
  url: string,
  finalUrl?: string, // Use final URL if available
): Promise<{
  success: boolean
  thirdPartyUrls?: ThirdPartyUrl[]
  error?: string
  status?: "success" | "cors-blocked" | "error"
  crawledUrl?: string // Which URL was actually crawled
}> => {
  // Use the final redirected URL if available, otherwise use original
  const urlToCrawl = finalUrl || url

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(urlToCrawl, {
      mode: "cors",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; URLExtractor/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const thirdPartyUrlStrings = extractUrlsFromHtml(html, urlToCrawl)

    const thirdPartyUrls: ThirdPartyUrl[] = thirdPartyUrlStrings.map((url) => ({ url }))

    return {
      success: true,
      thirdPartyUrls,
      status: "success",
      crawledUrl: urlToCrawl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: "Request timeout",
        status: "error",
        crawledUrl: urlToCrawl,
      }
    } else if (errorMessage.includes("CORS") || errorMessage.includes("cors")) {
      return {
        success: false,
        error: "CORS policy blocks access",
        status: "cors-blocked",
        crawledUrl: urlToCrawl,
      }
    } else {
      return {
        success: false,
        error: errorMessage,
        status: "error",
        crawledUrl: urlToCrawl,
      }
    }
  }
}
