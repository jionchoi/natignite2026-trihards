"use client"

import { useState, useCallback } from "react"
import { ParticleBackground } from "@/components/particle-background"
import { UploadZone } from "@/components/upload-zone"
import { AnalysisResults } from "@/components/analysis-results"
import { FloatingRoom } from "@/components/floating-room"
import { LoadingScreen } from "@/components/loading-screen"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, RotateCcw, DoorOpen, Bath, ParkingCircle, Store } from "lucide-react"

interface Issue {
  type: "error" | "warning" | "info"
  title: string
  description: string
  regulation?: string
}

interface AnalysisData {
  summary: string
  issues: Issue[]
}

export default function Home() {
  const [showLoader, setShowLoader] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFilesChange = useCallback((files: File[]) => {
    setSelectedFiles(files)
    setAnalysisData(null)
    setError(null)
  }, [])

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return

    setIsAnalyzing(true)
    setIsStreaming(true)
    setError(null)
    setAnalysisData({ summary: "", issues: [] })

    try {
      const formData = new FormData()
      for (const file of selectedFiles) {
        formData.append("image", file)
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk

        // Try to parse the accumulated JSON
        try {
          // Clean up the text - remove any potential markdown code blocks
          let cleanText = fullText.trim()
          if (cleanText.startsWith("```json")) {
            cleanText = cleanText.slice(7)
          }
          if (cleanText.startsWith("```")) {
            cleanText = cleanText.slice(3)
          }
          if (cleanText.endsWith("```")) {
            cleanText = cleanText.slice(0, -3)
          }

          const parsed = JSON.parse(cleanText) as AnalysisData
          setAnalysisData(parsed)
        } catch {
          // Not valid JSON yet, update summary with raw text for streaming effect
          setAnalysisData(prev => ({
            summary: fullText.slice(0, 200) + (fullText.length > 200 ? "..." : ""),
            issues: prev?.issues || []
          }))
        }
      }

      // Final parse
      let cleanText = fullText.trim()
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.slice(7)
      }
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.slice(3)
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.slice(0, -3)
      }

      try {
        const finalData = JSON.parse(cleanText) as AnalysisData
        setAnalysisData(finalData)
      } catch {
        setError("Failed to parse analysis results. Please try again.")
      }
    } catch (err) {
      console.error("Analysis error:", err)
      setError("Failed to analyze the image. Please try again.")
    } finally {
      setIsAnalyzing(false)
      setIsStreaming(false)
    }
  }

  const handleReset = () => {
    setSelectedFiles([])
    setAnalysisData(null)
    setError(null)
    setIsAnalyzing(false)
    setIsStreaming(false)
  }

  return (
    <>
      {showLoader && <LoadingScreen onComplete={() => setShowLoader(false)} />}
    <main className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10 flex flex-col items-center px-4 py-8 sm:py-12 md:py-16">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 teal-glow">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">
              Accessify
            </h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-md sm:max-w-lg mx-auto px-2 text-balance">
            Upload photos of your space and get instant AI-powered accessibility feedback. 
            Identify barriers before your customers do.
          </p>
        </header>

        {/* Example Use Cases */}
        {selectedFiles.length === 0 && !analysisData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-2xl mb-6 sm:mb-8">
            {[
              { icon: DoorOpen, label: "Entrances" },
              { icon: Bath, label: "Restrooms" },
              { icon: ParkingCircle, label: "Parking" },
              { icon: Store, label: "Retail Space" },
            ].map((item) => (
              <div
                key={item.label}
                className="frosted-glass rounded-lg p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 text-center"
              >
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <span className="text-xs sm:text-sm text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Floating 3D Room */}
        {selectedFiles.length === 0 && !analysisData && (
          <div className="w-full max-w-2xl animate-fade-in mb-6 sm:mb-8">
            <FloatingRoom />
          </div>
        )}

        {/* Main Content */}
        <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
          {/* Upload Zone */}
          <UploadZone
            onFilesChange={handleFilesChange}
            selectedFiles={selectedFiles}
            disabled={isAnalyzing}
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            {!analysisData && (
              <Button
                onClick={handleAnalyze}
                disabled={selectedFiles.length === 0 || isAnalyzing}
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Analyze Accessibility</span>
                  </>
                )}
              </Button>
            )}

            {analysisData && !isAnalyzing && (
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Analyze Another</span>
              </Button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="frosted-glass rounded-xl p-4 border-l-4 border-l-destructive animate-slide-in-up">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Analysis Results */}
          {analysisData && analysisData.summary && (
            <AnalysisResults
              issues={analysisData.issues}
              summary={analysisData.summary}
              isStreaming={isStreaming}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 sm:mt-16 text-center px-4">
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Powered by computer vision AI. Results are advisory and should be verified by a certified ACA accessibility consultant.
          </p>
        </footer>
      </div>
    </main>
    </>
  )
}
