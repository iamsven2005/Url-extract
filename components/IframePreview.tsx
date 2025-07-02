"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { AlertCircle, ExternalLink, ArrowRight, Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface IframePreviewProps {
  url: string
  originalUrl?: string
  isRedirected?: boolean
  isVisible: boolean
  onClose: () => void
}

export function IframePreview({ url, originalUrl, isRedirected = false, isVisible, onClose }: IframePreviewProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  if (!isVisible) return null

  const handleIframeLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const copyUrl = async (urlToCopy: string) => {
    try {
      await navigator.clipboard.writeText(urlToCopy)
      setCopiedUrl(urlToCopy)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      console.error("Failed to copy URL:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-5/6 flex flex-col">
        <div className="flex flex-col gap-3 p-4 border-b bg-gray-50">
          {isRedirected && originalUrl && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 font-medium">Original URL:</span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <code className="bg-white px-2 py-1 rounded text-xs border truncate flex-1 min-w-0">{originalUrl}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyUrl(originalUrl)}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  {copiedUrl === originalUrl ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {isRedirected && (
            <div className="flex items-center gap-2 text-center">
              <ArrowRight className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600 font-medium text-sm">Redirects to</span>
              <ArrowRight className="h-4 w-4 text-blue-600" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
              <span className="text-gray-900 font-medium">{isRedirected ? "Final Destination:" : "Previewing:"}</span>
              {isRedirected && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  Redirected Page
                </Badge>
              )}
            </div>
            <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-700 text-xl font-bold">
              ×
            </button>
          </div>

          <div className="flex items-center gap-2">
            <code className="bg-white px-3 py-2 rounded border text-sm flex-1 min-w-0 font-mono">{url}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyUrl(url)}
              className="h-8 w-8 p-0 flex-shrink-0"
              title="Copy URL"
            >
              {copiedUrl === url ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              className="flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </Button>
          </div>
        </div>

        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <span className="text-gray-600">Loading preview...</span>
                {isRedirected && <p className="text-sm text-green-600 mt-1">Loading redirected destination</p>}
              </div>
            </div>
          )}
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Cannot preview this website</p>
                <p className="text-sm text-gray-500 mb-4">The site may block iframe embedding or require HTTPS</p>
                {isRedirected && (
                  <div className="bg-green-50 p-3 rounded mb-4">
                    <p className="text-sm text-green-700 font-medium">This is the redirected destination:</p>
                    <code className="text-xs text-green-800 bg-white px-2 py-1 rounded mt-1 inline-block">{url}</code>
                  </div>
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              </div>
            </div>
          ) : (
            <iframe
              src={url}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms"
              title={`Preview of ${url}`}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
