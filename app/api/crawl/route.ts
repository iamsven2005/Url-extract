import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

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

    console.log("Crawling URL with curl:", url)

    // Use curl to fetch the webpage
    const curlCommand = `curl -L -s --max-time 15 --user-agent "Mozilla/5.0 (compatible; URLExtractor/1.0)" "${url}"`

    const { stdout, stderr } = await execAsync(curlCommand)

    if (stderr && !stdout) {
      console.error("Curl error:", stderr)
      return NextResponse.json(
        {
          error: "Failed to fetch webpage",
          details: stderr,
        },
        { status: 500 },
      )
    }

    const html = stdout

    if (!html || html.trim().length === 0) {
      return NextResponse.json(
        {
          error: "No content received from URL",
        },
        { status: 404 },
      )
    }

    console.log(`Successfully crawled ${url}, received ${html.length} characters`)

    return NextResponse.json({
      success: true,
      html,
      contentLength: html.length,
    })
  } catch (error) {
    console.error("Crawl API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
