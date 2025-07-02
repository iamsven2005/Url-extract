"use client"
import { useState } from "react"
import type React from "react"

import { Copy, Check, FileText, Globe, ExternalLink, Eye, ArrowRight, MapPin, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ExtractedUrl } from "../types"
import { ExportButtons } from "./ExportButtons"
import { IframePreview } from "./IframePreview"

interface UrlListProps {
  extractedUrls: ExtractedUrl[]
  onResolveIps: () => void
  onCrawlPages: () => void
  onResolveThirdPartyIps: () => void
  onCheckRedirects: () => void
  onCopyToClipboard: (text: string, index: number) => void
  isResolvingIps: boolean
  isCrawling: boolean
  isResolvingThirdPartyIps: boolean
  isCheckingRedirects: boolean
  copiedIndex: number | null
}

interface PreviewState {
  url: string
  originalUrl?: string
  isRedirected: boolean
}

export function UrlList({
  extractedUrls,
  onResolveIps,
  onCrawlPages,
  onResolveThirdPartyIps,
  onCheckRedirects,
  onCopyToClipboard,
  isResolvingIps,
  isCrawling,
  isResolvingThirdPartyIps,
  isCheckingRedirects,
  copiedIndex,
}: UrlListProps) {
  const [previewState, setPreviewState] = useState<PreviewState | null>(null)

  const getTotalThirdPartyUrls = () => {
    return extractedUrls.reduce((total, url) => total + (url.thirdPartyUrls?.length || 0), 0)
  }

  const getRedirectCount = () => {
    return extractedUrls.filter((url) => url.redirectInfo && url.redirectInfo.finalUrl !== url.root).length
  }

  const handleUrlClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handlePreviewClick = (url: string, originalUrl?: string, isRedirected = false, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setPreviewState({
      url,
      originalUrl,
      isRedirected,
    })
  }

  const closePreview = () => {
    setPreviewState(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Extracted Root URLs
              </CardTitle>
              <CardDescription>
                Found {extractedUrls.length} unique root URLs
                {getRedirectCount() > 0 && ` (${getRedirectCount()} redirected)`}
                {getTotalThirdPartyUrls() > 0 && `, ${getTotalThirdPartyUrls()} third-party URLs`}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={onCheckRedirects} variant="outline" size="sm" disabled={isCheckingRedirects}>
                {isCheckingRedirects ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Checking Redirects...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Check Redirects
                  </>
                )}
              </Button>
              <Button onClick={onCrawlPages} variant="outline" size="sm" disabled={isCrawling}>
                {isCrawling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Crawling...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Crawl Pages
                  </>
                )}
              </Button>
              <Button onClick={onResolveIps} variant="outline" size="sm" disabled={isResolvingIps}>
                {isResolvingIps ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Resolving...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Resolve IPs
                  </>
                )}
              </Button>
              <Button onClick={onResolveThirdPartyIps} variant="outline" size="sm" disabled={isResolvingThirdPartyIps}>
                {isResolvingThirdPartyIps ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Resolving 3rd Party...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Resolve 3rd Party IPs
                  </>
                )}
              </Button>
              <ExportButtons extractedUrls={extractedUrls} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {extractedUrls.map((urlData, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => handleUrlClick(urlData.root)}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate cursor-pointer text-left"
                        title="Click to open in new tab"
                      >
                        {urlData.root}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handlePreviewClick(urlData.root, undefined, false, e)}
                        className="h-6 w-6 p-0"
                        title="Preview original website"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                    {urlData.original !== urlData.root && (
                      <p className="text-sm text-gray-500 truncate">Original: {urlData.original}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => onCopyToClipboard(urlData.root, index)}>
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {urlData.ipAddress && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopyToClipboard(urlData.ipAddress!, index + 1000)}
                        title="Copy IP Address"
                      >
                        {copiedIndex === index + 1000 ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {urlData.isResolvingIp && (
                    <p className="text-blue-600 flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                      Resolving IP...
                    </p>
                  )}
                  {urlData.ipAddress && <p className="text-green-600 font-mono">IP: {urlData.ipAddress}</p>}
                  {urlData.ipError && <p className="text-red-500">IP: {urlData.ipError}</p>}

                  {urlData.isCheckingRedirect && (
                    <p className="text-blue-600 flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                      Checking redirects...
                    </p>
                  )}

                  {urlData.redirectInfo && (
                    <div className="bg-gradient-to-r from-yellow-50 to-green-50 p-4 rounded-lg border-l-4 border-yellow-400">
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowRight className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Redirect Detected</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          Final Destination
                        </Badge>
                      </div>

                      <div className="bg-white p-3 rounded border mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Link className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">Redirected URL:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-50 px-2 py-1 rounded text-xs border flex-1 min-w-0 font-mono">
                            {urlData.redirectInfo.finalUrl}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopyToClipboard(urlData.redirectInfo!.finalUrl, index + 5000)}
                            className="h-6 w-6 p-0"
                            title="Copy redirected URL"
                          >
                            {copiedIndex === index + 5000 ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handlePreviewClick(urlData.redirectInfo!.finalUrl, urlData.root, true, e)}
                            className="h-6 w-6 p-0"
                            title="Preview redirected destination"
                          >
                            <Eye className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUrlClick(urlData.redirectInfo!.finalUrl)}
                            className="h-6 w-6 p-0"
                            title="Open redirected URL"
                          >
                            <ExternalLink className="h-3 w-3 text-green-600" />
                          </Button>
                        </div>
                      </div>

                      {urlData.redirectInfo.redirectChain.length > 2 && (
                        <div className="mb-2">
                          <p className="text-xs text-yellow-700 mb-1 font-medium">Full redirect chain:</p>
                          <div className="space-y-1">
                            {urlData.redirectInfo.redirectChain.map((redirectUrl, redirectIndex) => (
                              <div key={redirectIndex} className="flex items-center gap-1 text-xs">
                                {redirectIndex > 0 && <ArrowRight className="h-3 w-3 text-yellow-600" />}
                                <span className="text-gray-600 text-xs">{redirectIndex + 1}.</span>
                                <button
                                  onClick={() => handleUrlClick(redirectUrl)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                                >
                                  {redirectUrl}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {urlData.redirectInfo.finalIpAddress && (
                        <p className="text-green-600 font-mono text-sm">
                          Final IP: {urlData.redirectInfo.finalIpAddress}
                        </p>
                      )}
                      {urlData.redirectInfo.finalIpError && (
                        <p className="text-red-500 text-sm">Final IP: {urlData.redirectInfo.finalIpError}</p>
                      )}
                    </div>
                  )}

                  {urlData.isCrawling && (
                    <p className="text-blue-600 flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                      {urlData.redirectInfo ? "Crawling redirected page..." : "Crawling page..."}
                    </p>
                  )}

                  {urlData.crawlStatus === "success" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Crawled Successfully
                      </Badge>
                      {urlData.redirectInfo && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                          Crawled Final URL
                        </Badge>
                      )}
                      {urlData.thirdPartyUrls && urlData.thirdPartyUrls.length > 0 && (
                        <span className="text-green-600 text-sm">
                          Found {urlData.thirdPartyUrls.length} third-party URLs
                        </span>
                      )}
                    </div>
                  )}

                  {urlData.crawlStatus === "cors-blocked" && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        CORS Blocked
                      </Badge>
                      {urlData.redirectInfo && (
                        <span className="text-xs text-gray-500">(Tried to crawl: {urlData.redirectInfo.finalUrl})</span>
                      )}
                    </div>
                  )}

                  {urlData.crawlStatus === "error" && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Crawl Failed
                      </Badge>
                      <span className="text-red-500 text-xs">{urlData.crawlError}</span>
                    </div>
                  )}
                </div>

                {urlData.thirdPartyUrls && urlData.thirdPartyUrls.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-green-200 bg-green-50 rounded-r">
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" />
                        Third-party URLs found:
                        {urlData.redirectInfo && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs ml-2">
                            From Redirected Page
                          </Badge>
                        )}
                      </p>
                      {urlData.redirectInfo && (
                        <p className="text-xs text-green-700 mb-2 font-mono bg-white px-2 py-1 rounded border">
                          Source: {urlData.redirectInfo.finalUrl}
                        </p>
                      )}
                      <div className="space-y-2">
                        {urlData.thirdPartyUrls.map((thirdPartyUrl, tpIndex) => (
                          <div
                            key={tpIndex}
                            className="flex items-center justify-between text-sm bg-white p-2 rounded border"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUrlClick(thirdPartyUrl.url)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline truncate cursor-pointer"
                                >
                                  {thirdPartyUrl.url}
                                </button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handlePreviewClick(thirdPartyUrl.url, undefined, false, e)}
                                  className="h-5 w-5 p-0"
                                  title="Preview website"
                                >
                                  <Eye className="h-2 w-2" />
                                </Button>
                              </div>
                              {thirdPartyUrl.isResolvingIp && (
                                <p className="text-blue-600 flex items-center text-xs">
                                  <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-blue-600 mr-1"></div>
                                  Resolving IP...
                                </p>
                              )}
                              {thirdPartyUrl.ipAddress && (
                                <p className="text-green-600 font-mono text-xs">IP: {thirdPartyUrl.ipAddress}</p>
                              )}
                              {thirdPartyUrl.ipError && (
                                <p className="text-red-500 text-xs">IP: {thirdPartyUrl.ipError}</p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onCopyToClipboard(thirdPartyUrl.url, index * 1000 + tpIndex + 2000)}
                                className="h-6 w-6 p-0"
                              >
                                {copiedIndex === index * 1000 + tpIndex + 2000 ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                              {thirdPartyUrl.ipAddress && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onCopyToClipboard(thirdPartyUrl.ipAddress!, index * 1000 + tpIndex + 3000)
                                  }
                                  className="h-6 w-6 p-0"
                                  title="Copy IP Address"
                                >
                                  {copiedIndex === index * 1000 + tpIndex + 3000 ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {previewState && (
        <IframePreview
          url={previewState.url}
          originalUrl={previewState.originalUrl}
          isRedirected={previewState.isRedirected}
          isVisible={true}
          onClose={closePreview}
        />
      )}
    </>
  )
}
