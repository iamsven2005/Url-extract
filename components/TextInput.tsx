"use client"

import { useState } from "react"
import { FileText, ClipboardPasteIcon as Paste } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface TextInputProps {
  onTextSubmit: (text: string) => void
  isProcessing: boolean
}

export function TextInput({ onTextSubmit, isProcessing }: TextInputProps) {
  const [inputText, setInputText] = useState("")

  const handleSubmit = () => {
    if (inputText.trim()) {
      onTextSubmit(inputText.trim())
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInputText(text)
    } catch (error) {
      // Clipboard access failed, user will need to paste manually
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Or Paste Text Directly
        </CardTitle>
        <CardDescription>
          If file upload fails, you can paste your text content directly here to extract URLs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="text-input" className="text-sm font-medium">
              Paste your text content:
            </label>
            <Button onClick={handlePaste} variant="outline" size="sm">
              <Paste className="h-4 w-4 mr-2" />
              Paste from Clipboard
            </Button>
          </div>
          <Textarea
            id="text-input"
            placeholder="Paste your text content here... The tool will automatically find and extract all URLs from the text."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            className="resize-none"
          />
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {inputText.length} characters • {inputText.split(/\s+/).filter(Boolean).length} words
          </p>
          <Button onClick={handleSubmit} disabled={!inputText.trim() || isProcessing}>
            Extract URLs from Text
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
