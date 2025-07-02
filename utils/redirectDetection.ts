import { resolveUrlIp } from "./ipResolution"
import type { RedirectInfo } from "../types"

export const checkRedirects = async (url: string): Promise<RedirectInfo | null> => {
  console.log("Checking redirects for:", url)

  try {
    // Validate URL first
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch (error) {
      console.error("Invalid URL:", url)
      return null
    }

    const redirectChain: string[] = [url]
    let currentUrl = url
    let finalUrl = url
    let statusCode = 200
    const maxRedirects = 10
    const visitedUrls = new Set<string>([url])

    console.log("Starting redirect check for:", url)

    // Follow redirects manually
    for (let i = 0; i < maxRedirects; i++) {
      try {
        console.log(`Redirect check ${i + 1}: Fetching ${currentUrl}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(currentUrl, {
          method: "HEAD",
          mode: "cors",
          redirect: "manual", // This is key - handle redirects manually
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; URLExtractor/1.0)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        })

        clearTimeout(timeoutId)
        statusCode = response.status

        console.log(`Response status: ${response.status} for ${currentUrl}`)

        // Check if this is a redirect status code
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location")
          console.log(`Redirect detected. Location header: ${location}`)

          if (location) {
            try {
              // Handle relative URLs
              const nextUrl = new URL(location, currentUrl).href
              console.log(`Next URL: ${nextUrl}`)

              // Check if we've already visited this URL (prevent infinite loops)
              if (visitedUrls.has(nextUrl)) {
                console.warn("Redirect loop detected, stopping:", nextUrl)
                break
              }

              visitedUrls.add(nextUrl)
              redirectChain.push(nextUrl)
              currentUrl = nextUrl
              finalUrl = nextUrl

              console.log(`Added to redirect chain: ${nextUrl}`)
            } catch (urlError) {
              console.error("Invalid redirect URL:", location, urlError)
              break
            }
          } else {
            console.log("Redirect status but no location header")
            break
          }
        } else {
          console.log("Not a redirect, final destination reached")
          break
        }
      } catch (error) {
        console.error("Fetch error for:", currentUrl, error)

        // If it's a CORS error, try a different approach
        if (error instanceof Error && error.message.includes("cors")) {
          console.log("CORS error, trying alternative method")

          // Try with GET request instead of HEAD
          try {
            const getResponse = await fetch(currentUrl, {
              method: "GET",
              mode: "no-cors", // This won't give us headers but might work
              redirect: "follow", // Let browser handle redirects
            })

            // We can't get the actual redirect info with no-cors, but we can try
            console.log("Alternative fetch completed, but can't get redirect info due to CORS")
          } catch (getError) {
            console.error("Alternative fetch also failed:", getError)
          }
        }
        break
      }
    }

    console.log("Final redirect chain:", redirectChain)
    console.log("Final URL:", finalUrl)

    // Only return redirect info if there was actually a redirect
    if (finalUrl === url || redirectChain.length <= 1) {
      console.log("No redirect detected")
      return null
    }

    console.log("Redirect detected, getting IP for final URL")

    // Get IP for final destination
    let finalIpAddress: string | undefined
    let finalIpError: string | undefined

    try {
      const ipResult = await resolveUrlIp(finalUrl)
      if (ipResult.ip) {
        finalIpAddress = ipResult.ip
        console.log("Final IP resolved:", finalIpAddress)
      } else {
        finalIpError = ipResult.error
        console.log("Final IP resolution failed:", finalIpError)
      }
    } catch (error) {
      finalIpError = "Failed to resolve final IP"
      console.error("IP resolution error:", error)
    }

    const redirectInfo = {
      finalUrl,
      redirectChain,
      finalIpAddress,
      finalIpError,
      statusCode,
    }

    console.log("Returning redirect info:", redirectInfo)
    return redirectInfo
  } catch (error) {
    console.error("Error in checkRedirects:", error)
    return null
  }
}
