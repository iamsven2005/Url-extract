"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { ExtractedUrl } from "../types"
import { extractUrlsFromText } from "../utils/urlExtraction"
import { resolveUrlIp } from "../utils/ipResolution"
import { crawlPage } from "../utils/htmlCrawling"
import { checkRedirects as checkUrlRedirects } from "../utils/redirectDetection"
import { FileUpload } from "../components/FileUpload"
import { TextInput } from "../components/TextInput"
import { UrlList } from "../components/UrlList"
import { extractTextFromDocx, extractTextFromPdf } from "../utils/docxParser"

export default function URLExtractor() {
  const [file, setFile] = useState<File | null>(null)
  const [extractedUrls, setExtractedUrls] = useState<ExtractedUrl[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [hasFileError, setHasFileError] = useState(false)
  const { toast } = useToast()
  const [isResolvingIps, setIsResolvingIps] = useState(false)
  const [isCrawling, setIsCrawling] = useState(false)
  const [isResolvingThirdPartyIps, setIsResolvingThirdPartyIps] = useState(false)
  const [isCheckingRedirects, setIsCheckingRedirects] = useState(false)

  const processText = (text: string, source = "text input") => {
    try {
      if (!text || text.trim().length === 0) {
        toast({
          title: "No Content",
          description: "Please provide some text content to extract URLs from.",
          variant: "destructive",
        })
        return
      }

      const urls = extractUrlsFromText(text)

      if (urls.length === 0) {
        toast({
          title: "No URLs Found",
          description: `No URLs were found in the ${source}. Please check that the content contains valid URLs (starting with http:// or https://).`,
          variant: "destructive",
        })
        return
      }

      setExtractedUrls(urls)
      setHasFileError(false)

      toast({
        title: "Success!",
        description: `Extracted ${urls.length} unique root URLs from ${source}.`,
      })
    } catch (error) {
      console.error("Text processing error:", error)
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process the text.",
        variant: "destructive",
      })
    }
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setHasFileError(false)

    try {
      let text = ""
      let processingMethod = ""

      if (file.type === "text/plain") {
        text = await file.text()
        processingMethod = "plain text file"

        if (!text || text.trim().length === 0) {
          throw new Error("The text file appears to be empty.")
        }
      } else if (file.type === "application/pdf") {
        try {
          text = await extractTextFromPdf(file)
          processingMethod = "PDF file"

          toast({
            title: "PDF Processed",
            description: "URLs extracted from PDF using basic text extraction.",
          })
        } catch (error) {
          console.log("PDF processing failed, showing user-friendly message")
          setHasFileError(true)

          toast({
            title: "PDF Processing Failed",
            description:
              "Could not extract URLs from this PDF. Please try copying the text content and using the text input below instead.",
            variant: "destructive",
          })
          return
        }
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        try {
          text = await extractTextFromDocx(file)
          processingMethod = "Word document"

          toast({
            title: "Word Document Processed",
            description: "URLs extracted from Word document using basic extraction.",
          })
        } catch (error) {
          console.log("Word processing failed, showing user-friendly message")
          setHasFileError(true)

          toast({
            title: "Word Document Processing Failed",
            description:
              "Could not extract URLs from this Word document. Please copy the text content and use the text input below instead.",
            variant: "destructive",
          })
          return
        }
      } else {
        // Try to process as text file
        try {
          text = await file.text()
          processingMethod = "file (treated as text)"
        } catch (error) {
          setHasFileError(true)
          toast({
            title: "Unsupported File Type",
            description:
              "This file type is not supported. Please use a .txt, .pdf, or .docx file, or copy and paste the content below.",
            variant: "destructive",
          })
          return
        }
      }

      // Process the extracted text
      processText(text, processingMethod)
    } catch (error) {
      console.error("File processing error:", error)
      setHasFileError(true)

      toast({
        title: "File Processing Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process the file. Please try the text input option below.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
      toast({
        title: "Copied!",
        description: "Text copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  const resolveIpAddresses = async () => {
    setIsResolvingIps(true)
    const updatedUrls = [...extractedUrls]

    updatedUrls.forEach((url) => {
      url.isResolvingIp = true
      url.ipError = undefined
    })
    setExtractedUrls(updatedUrls)

    for (let i = 0; i < updatedUrls.length; i++) {
      const result = await resolveUrlIp(updatedUrls[i].root)

      if (result.ip) {
        updatedUrls[i].ipAddress = result.ip
      } else {
        updatedUrls[i].ipError = result.error
      }

      updatedUrls[i].isResolvingIp = false
      setExtractedUrls([...updatedUrls])

      if (i < updatedUrls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    setIsResolvingIps(false)
    toast({
      title: "IP Resolution Complete",
      description: `Resolved IP addresses for ${updatedUrls.filter((url) => url.ipAddress).length} domains.`,
    })
  }

  const crawlPages = async () => {
    setIsCrawling(true)
    const updatedUrls = [...extractedUrls]

    updatedUrls.forEach((url) => {
      url.isCrawling = true
      url.crawlStatus = "pending"
      url.crawlError = undefined
      url.thirdPartyUrls = []
    })
    setExtractedUrls(updatedUrls)

    let totalThirdPartyUrls = 0

    for (let i = 0; i < updatedUrls.length; i++) {
      // Use the final redirected URL if available, otherwise use the original
      const urlToCrawl = updatedUrls[i].redirectInfo?.finalUrl || updatedUrls[i].root

      const result = await crawlPage(updatedUrls[i].root, updatedUrls[i].redirectInfo?.finalUrl)

      if (result.success && result.thirdPartyUrls) {
        updatedUrls[i].thirdPartyUrls = result.thirdPartyUrls
        updatedUrls[i].crawlStatus = "success"
        totalThirdPartyUrls += result.thirdPartyUrls.length
      } else {
        updatedUrls[i].crawlStatus = result.status || "error"
        updatedUrls[i].crawlError = result.error
      }

      updatedUrls[i].isCrawling = false
      setExtractedUrls([...updatedUrls])

      if (i < updatedUrls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    setIsCrawling(false)

    const successCount = updatedUrls.filter((url) => url.crawlStatus === "success").length
    const corsBlockedCount = updatedUrls.filter((url) => url.crawlStatus === "cors-blocked").length
    const redirectedCrawlCount = updatedUrls.filter((url) => url.redirectInfo && url.crawlStatus === "success").length

    toast({
      title: "Page Crawling Complete",
      description: `Successfully crawled ${successCount} pages (${redirectedCrawlCount} redirected), found ${totalThirdPartyUrls} third-party URLs. ${corsBlockedCount} pages blocked by CORS.`,
    })
  }

  const resolveThirdPartyIps = async () => {
    setIsResolvingThirdPartyIps(true)
    const updatedUrls = [...extractedUrls]

    updatedUrls.forEach((url) => {
      if (url.thirdPartyUrls) {
        url.thirdPartyUrls.forEach((thirdPartyUrl) => {
          thirdPartyUrl.isResolvingIp = true
          thirdPartyUrl.ipError = undefined
        })
      }
    })
    setExtractedUrls(updatedUrls)

    let resolvedCount = 0

    for (let i = 0; i < updatedUrls.length; i++) {
      if (updatedUrls[i].thirdPartyUrls) {
        for (let j = 0; j < updatedUrls[i].thirdPartyUrls!.length; j++) {
          const thirdPartyUrl = updatedUrls[i].thirdPartyUrls![j]
          const result = await resolveUrlIp(thirdPartyUrl.url)

          if (result.ip) {
            thirdPartyUrl.ipAddress = result.ip
            resolvedCount++
          } else {
            thirdPartyUrl.ipError = result.error
          }

          thirdPartyUrl.isResolvingIp = false
          setExtractedUrls([...updatedUrls])

          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }
    }

    setIsResolvingThirdPartyIps(false)
    toast({
      title: "Third-party IP Resolution Complete",
      description: `Resolved IP addresses for ${resolvedCount} third-party domains.`,
    })
  }

  const checkRedirects = async () => {
    setIsCheckingRedirects(true)
    const updatedUrls = [...extractedUrls]

    // Reset redirect info and set checking state
    updatedUrls.forEach((url) => {
      url.isCheckingRedirect = true
      url.redirectInfo = undefined
    })
    setExtractedUrls([...updatedUrls])

    let redirectCount = 0
    let checkedCount = 0

    console.log("Starting redirect check for", updatedUrls.length, "URLs")

    for (let i = 0; i < updatedUrls.length; i++) {
      try {
        console.log(`Checking redirects for URL ${i + 1}/${updatedUrls.length}:`, updatedUrls[i].root)

        const redirectInfo = await checkUrlRedirects(updatedUrls[i].root)

        console.log("Redirect check result:", redirectInfo)

        if (redirectInfo) {
          console.log("Redirect detected for:", updatedUrls[i].root, "->", redirectInfo.finalUrl)
          updatedUrls[i].redirectInfo = redirectInfo
          redirectCount++
        } else {
          console.log("No redirect for:", updatedUrls[i].root)
        }

        updatedUrls[i].isCheckingRedirect = false
        checkedCount++

        // Update the UI with current progress
        setExtractedUrls([...updatedUrls])

        // Add delay between requests to avoid overwhelming servers
        if (i < updatedUrls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Error checking redirects for ${updatedUrls[i].root}:`, error)
        updatedUrls[i].isCheckingRedirect = false
        setExtractedUrls([...updatedUrls])
      }
    }

    setIsCheckingRedirects(false)

    console.log(`Redirect check complete. Found ${redirectCount} redirects out of ${checkedCount} URLs checked.`)

    toast({
      title: "Redirect Check Complete",
      description: `Checked ${checkedCount} URLs and found ${redirectCount} redirects.`,
    })
  }

  // Updated demo text with some URLs that are likely to redirect
  const demoText = `Website Access for Engineers 
Company Website https://www.ywlgroup.com/ 
Government Website https://www.bd.gov.hk/ 
https://www.hyd.gov.hk/ 
https://www.td.gov.hk/ 
https://www.hko.gov.hk/ 
https://www.cedd.gov.hk/ 
https://www.wsd.gov.hk/ 
https://www.dsd.gov.hk/ 
https://www.devb.gov.hk/ 
GEO Database: https://www.ginfo.cedd.gov.hk/GEOOpenData/eng/Default.aspx 
GEO Database: https://www.ginfo.cedd.gov.hk/GInfoInt/ 
Common Spatial Data Infrastructure: https://portal.csdi.gov.hk 
Open3Dhk: https://3d.map.gov.hk 
Engineer Institution https://www.hkie.org.hk/ 
https://www.ice.org.uk/ 
https://www.newcivilengineer.com/ 
Engineering Information https://www.steelforlifebluebook.co.uk/ 
https://vsl.com/ 
http://www.freyssinet.com/ 
https://freyssinet.co.uk/ 
https://www.hilti.com.hk/ 
https://eurocodeapplied.com/ 
Structural Software Midas Tutorial: https://academy.midasuser.com/ 
Slope/W Tutorial: https://www.seequent.com/getting-started-with-slope-w/ 
Structural Analysis / Math Tool Online https://structural-analyser.com/ 
https://www.wolframalpha.com/ 
https://www.mathway.com/ 
Others Wikipedia: https://en.wikipedia.org/ 
Wikipedia: https://zh.wikipedia.org/ 
Test redirects: https://httpbin.org/redirect/1 
https://httpbin.org/redirect-to?url=https://www.google.com
Zoom Link: Conference Room: https://us06web.zoom.us/j/2891720849?pwd=D3TsxtzK3Ik1UUTeYIpNia6us6wUuk.1`

  const runDemo = () => {
    processText(demoText, "demo")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Website URL Extractor</h1>
          <p className="text-lg text-gray-600">Extract and organize root URLs from documents or text</p>
        </div>

        <FileUpload
          onFileSelect={(file) => {
            setFile(file)
            processFile(file)
          }}
          onDemo={runDemo}
          selectedFile={file}
          isProcessing={isProcessing}
          hasError={hasFileError}
        />

        <TextInput onTextSubmit={(text) => processText(text, "pasted text")} isProcessing={isProcessing} />

        {isProcessing && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Processing...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {extractedUrls.length > 0 && (
          <UrlList
            extractedUrls={extractedUrls}
            onResolveIps={resolveIpAddresses}
            onCrawlPages={crawlPages}
            onResolveThirdPartyIps={resolveThirdPartyIps}
            onCheckRedirects={checkRedirects}
            onCopyToClipboard={copyToClipboard}
            isResolvingIps={isResolvingIps}
            isCrawling={isCrawling}
            isResolvingThirdPartyIps={isResolvingThirdPartyIps}
            isCheckingRedirects={isCheckingRedirects}
            copiedIndex={copiedIndex}
          />
        )}
      </div>
    </div>
  )
}
