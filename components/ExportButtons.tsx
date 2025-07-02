"use client"
import { FileText, Table, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { ExtractedUrl } from "../types"
import { exportToTxt, exportToCsv, exportToXlsx, downloadFile } from "../utils/exportUtils"

interface ExportButtonsProps {
  extractedUrls: ExtractedUrl[]
}

export function ExportButtons({ extractedUrls }: ExportButtonsProps) {
  const { toast } = useToast()

  const handleExportTxt = async () => {
    try {
      const content = exportToTxt(extractedUrls)
      downloadFile(content, "url-analysis.txt", "text/plain")
      toast({
        title: "Export Complete",
        description: "URLs exported as TXT file.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export TXT file.",
        variant: "destructive",
      })
    }
  }

  const handleExportCsv = async () => {
    try {
      const content = exportToCsv(extractedUrls)
      downloadFile(content, "url-analysis.csv", "text/csv")
      toast({
        title: "Export Complete",
        description: "URLs exported as CSV file.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV file.",
        variant: "destructive",
      })
    }
  }

  const handleExportXlsx = async () => {
    try {
      const content = await exportToXlsx(extractedUrls)
      downloadFile(content, "url-analysis.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      toast({
        title: "Export Complete",
        description: "URLs exported as Excel file.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export Excel file.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleExportTxt} variant="outline" size="sm">
        <FileText className="h-4 w-4 mr-2" />
        TXT
      </Button>
      <Button onClick={handleExportCsv} variant="outline" size="sm">
        <Table className="h-4 w-4 mr-2" />
        CSV
      </Button>
      <Button onClick={handleExportXlsx} variant="outline" size="sm">
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        XLSX
      </Button>
    </div>
  )
}
