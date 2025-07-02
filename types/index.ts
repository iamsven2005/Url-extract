export interface ExtractedUrl {
  original: string
  root: string
  ipAddress?: string
  isResolvingIp?: boolean
  ipError?: string
  isCrawling?: boolean
  crawlError?: string
  thirdPartyUrls?: ThirdPartyUrl[]
  crawlStatus?: "pending" | "success" | "error" | "cors-blocked"
  redirectInfo?: RedirectInfo
  isCheckingRedirect?: boolean
}

export interface RedirectInfo {
  finalUrl: string
  redirectChain: string[]
  finalIpAddress?: string
  isResolvingFinalIp?: boolean
  finalIpError?: string
  statusCode?: number
}

export interface ThirdPartyUrl {
  url: string
  ipAddress?: string
  isResolvingIp?: boolean
  ipError?: string
  redirectInfo?: RedirectInfo
  isCheckingRedirect?: boolean
}

export interface ExportData {
  type: "primary" | "third-party"
  url: string
  ipAddress?: string
  parentUrl?: string
  finalUrl?: string
  finalIpAddress?: string
}
