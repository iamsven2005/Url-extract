"use client"

import type React from "react"
import { useCallback } from "react"
import { Upload, FileText, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onDemo: () => void
  selectedFile: File | null
  isProcessing: boolean
  hasError?: boolean
}

export function FileUpload({ onFileSelect, onDemo, selectedFile, isProcessing, hasError }: FileUploadProps) {
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect],
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload File
        </CardTitle>
        <CardDescription>
          Upload a text file (.txt), Word document (.docx), or PDF file (.pdf) to extract URLs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Drop your file here or click to browse</p>
          <p className="text-sm text-gray-500 mb-4">Best results with .txt files</p>
          <input type="file" accept=".txt,.pdf,.docx" onChange={handleFileUpload} className="hidden" id="file-upload" />
          <Button variant="outline" className="cursor-pointer bg-transparent pointer-events-none">
            Choose File
          </Button>
        </div>

        {hasError && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>File processing failed.</strong> Please try copying the content from your document and using the
              text input below instead.
            </AlertDescription>
          </Alert>
        )}

        {!hasError && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> For best results, save your document as a .txt file first, or copy and paste the
              content using the text input below.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 flex justify-center">
          <Button onClick={onDemo} variant="secondary" disabled={isProcessing}>
            Try Demo with Sample Text
          </Button>
        </div>

        {selectedFile && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Selected file:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
