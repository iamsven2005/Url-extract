import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

interface RedirectInfo {
  finalUrl: string
  redirectChain: Array<{
    url: string
    statusCode: number
  }>
  redirectCount: number
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    console.log("Checking redirects for URL:", url)

    // Use curl to follow redirects and get detailed information
    const curlCommand = `curl -L -s -w "%{url_effective}|%{response_code}|%{redirect_url}" --max-time 10 --user-agent "Mozilla/5.0 (compatible; URLExtractor/1.0)" "${url}"`

    const { stdout, stderr } = await execAsync(curlCommand)

    if (stderr && stderr.includes("error")) {
      console.error("Curl redirect error:", stderr)
      return NextResponse.json(
        {
          error: "Failed to check redirects",
          details: stderr,
        },
        { status: 500 },
      )
    }

    // Parse curl output
    const lines = stdout.split("\n")
    const lastLine = lines[lines.length - 1] || lines[lines.length - 2] // Get last non-empty line
    const [finalUrl, responseCode] = lastLine.split("|")

    if (!finalUrl || finalUrl === url) {
      // No redirect detected
      return NextResponse.json({
        hasRedirect: false,
        finalUrl: url,
      })
    }

    // Build redirect info
    const redirectInfo: RedirectInfo = {
      finalUrl: finalUrl.trim(),
      redirectChain: [
        { url: url, statusCode: Number.parseInt(responseCode) || 200 },
        { url: finalUrl.trim(), statusCode: 200 },
      ],
      redirectCount: 1,
    }

    console.log(`Redirect detected: ${url} -> ${redirectInfo.finalUrl}`)

    return NextResponse.json({
      hasRedirect: true,
      redirectInfo,
    })
  } catch (error) {
    console.error("Redirect API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
