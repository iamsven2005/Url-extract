import type { RedirectInfo } from "../types"

export const checkRedirects = async (url: string): Promise<RedirectInfo | null> => {
  try {
    console.log("Checking redirects for:", url)

    const response = await fetch("/api/redirect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Redirect API error:", data)
      return null
    }

    if (!data.hasRedirect) {
      console.log("No redirect detected for:", url)
      return null
    }

    console.log("Redirect info received:", data.redirectInfo)
    return data.redirectInfo
  } catch (error) {
    console.error("Error checking redirects for", url, ":", error)
    return null
  }
}
