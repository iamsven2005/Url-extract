export interface ExtractedUrl {
  root: string
  count: number
  originalUrls: string[]
  ipAddress?: string
  ipError?: string
  isResolvingIp?: boolean
  thirdPartyUrls?: ThirdPartyUrl[]
  crawlStatus?: "pending" | "success" | "cors-blocked" | "error"
  crawlError?: string
  isCrawling?: boolean
  redirectInfo?: RedirectInfo
  isCheckingRedirect?: boolean
}

export interface ThirdPartyUrl {
  url: string
  ipAddress?: string
  ipError?: string
  isResolvingIp?: boolean
}

export interface RedirectInfo {
  finalUrl: string
  redirectChain: Array<{
    url: string
    statusCode: number
  }>
  redirectCount: number
}
