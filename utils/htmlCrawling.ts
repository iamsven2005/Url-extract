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
    console.log("Crawling page:", urlToCrawl)

    const response = await fetch("/api/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: urlToCrawl }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Crawl API error:", data)
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
        status: "error",
        crawledUrl: urlToCrawl,
      }
    }

    if (!data.success || !data.html) {
      return {
        success: false,
        error: data.error || "No HTML content received",
        status: "error",
        crawledUrl: urlToCrawl,
      }
    }

    console.log(`Successfully received HTML content (${data.contentLength} chars) for:`, urlToCrawl)

    // Extract third-party URLs from the HTML
    const thirdPartyUrlStrings = extractUrlsFromHtml(data.html, urlToCrawl)
    const thirdPartyUrls: ThirdPartyUrl[] = thirdPartyUrlStrings.map((url) => ({ url }))

    console.log(`Found ${thirdPartyUrls.length} third-party URLs in:`, urlToCrawl)

    return {
      success: true,
      thirdPartyUrls,
      status: "success",
      crawledUrl: urlToCrawl,
    }
  } catch (error) {
    console.error("Crawling error for", urlToCrawl, ":", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return {
      success: false,
      error: errorMessage,
      status: "error",
      crawledUrl: urlToCrawl,
    }
  }
}
