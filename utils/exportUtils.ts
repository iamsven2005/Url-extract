import type { ExtractedUrl, ExportData } from "../types"

export const prepareExportData = (extractedUrls: ExtractedUrl[]): ExportData[] => {
  const exportData: ExportData[] = []

  extractedUrls.forEach((url) => {
    // Add primary URL
    exportData.push({
      type: "primary",
      url: url.root,
      ipAddress: url.ipAddress,
      finalUrl: url.redirectInfo?.finalUrl,
      finalIpAddress: url.redirectInfo?.finalIpAddress,
    })

    // Add third-party URLs
    if (url.thirdPartyUrls) {
      url.thirdPartyUrls.forEach((thirdPartyUrl) => {
        exportData.push({
          type: "third-party",
          url: thirdPartyUrl.url,
          ipAddress: thirdPartyUrl.ipAddress,
          parentUrl: url.root,
          finalUrl: thirdPartyUrl.redirectInfo?.finalUrl,
          finalIpAddress: thirdPartyUrl.redirectInfo?.finalIpAddress,
        })
      })
    }
  })

  return exportData
}

export const exportToTxt = (extractedUrls: ExtractedUrl[]) => {
  let content = "Website URL Analysis Report\n"
  content += "=".repeat(50) + "\n\n"

  extractedUrls.forEach((url, index) => {
    content += `${index + 1}. ${url.root}\n`
    if (url.ipAddress) {
      content += `   IP: ${url.ipAddress}\n`
    }
    if (url.ipError) {
      content += `   IP Error: ${url.ipError}\n`
    }

    if (url.redirectInfo && url.redirectInfo.finalUrl !== url.root) {
      content += `   Redirects to: ${url.redirectInfo.finalUrl}\n`
      if (url.redirectInfo.finalIpAddress) {
        content += `   Final IP: ${url.redirectInfo.finalIpAddress}\n`
      }
      if (url.redirectInfo.redirectChain.length > 2) {
        content += `   Redirect chain: ${url.redirectInfo.redirectChain.join(" → ")}\n`
      }
    }

    if (url.thirdPartyUrls && url.thirdPartyUrls.length > 0) {
      content += `   Third-party URLs (${url.thirdPartyUrls.length}):\n`
      url.thirdPartyUrls.forEach((thirdPartyUrl) => {
        content += `   └─ ${thirdPartyUrl.url}\n`
        if (thirdPartyUrl.ipAddress) {
          content += `      IP: ${thirdPartyUrl.ipAddress}\n`
        }
        if (thirdPartyUrl.ipError) {
          content += `      IP Error: ${thirdPartyUrl.ipError}\n`
        }
      })
    }
    content += "\n"
  })

  return content
}

export const exportToCsv = (extractedUrls: ExtractedUrl[]) => {
  const exportData = prepareExportData(extractedUrls)

  let csv = "Type,URL,IP Address,Parent URL,Final URL,Final IP Address\n"

  exportData.forEach((row) => {
    const type = row.type
    const url = `"${row.url}"`
    const ip = row.ipAddress ? `"${row.ipAddress}"` : ""
    const parent = row.parentUrl ? `"${row.parentUrl}"` : ""
    const finalUrl = row.finalUrl ? `"${row.finalUrl}"` : ""
    const finalIp = row.finalIpAddress ? `"${row.finalIpAddress}"` : ""

    csv += `${type},${url},${ip},${parent},${finalUrl},${finalIp}\n`
  })

  return csv
}

export const exportToXlsx = async (extractedUrls: ExtractedUrl[]) => {
  // Using a simple approach to create XLSX data
  // In a real implementation, you'd use a library like 'xlsx'
  const exportData = prepareExportData(extractedUrls)

  // For now, we'll create a CSV-like structure that can be opened in Excel
  let content = "Type\tURL\tIP Address\tParent URL\tFinal URL\tFinal IP Address\n"

  exportData.forEach((row) => {
    const type = row.type
    const url = row.url
    const ip = row.ipAddress || ""
    const parent = row.parentUrl || ""
    const finalUrl = row.finalUrl || ""
    const finalIp = row.finalIpAddress || ""

    content += `${type}\t${url}\t${ip}\t${parent}\t${finalUrl}\t${finalIp}\n`
  })

  return content
}

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
