"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Upload, X, Camera, Plus } from "lucide-react"
import Image from "next/image"

interface UploadZoneProps {
  onFilesChange: (files: File[]) => void
  selectedFiles: File[]
  disabled?: boolean
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_BYTES = 10 * 1024 * 1024

export function UploadZone({ onFilesChange, selectedFiles, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const urlCacheRef = useRef<Map<File, string>>(new Map())

  const getPreviewUrl = (file: File): string => {
    if (!urlCacheRef.current.has(file)) {
      urlCacheRef.current.set(file, URL.createObjectURL(file))
    }
    return urlCacheRef.current.get(file)!
  }

  // Revoke URLs for files that were removed
  useEffect(() => {
    const selectedSet = new Set(selectedFiles)
    for (const [file, url] of urlCacheRef.current) {
      if (!selectedSet.has(file)) {
        URL.revokeObjectURL(url)
        urlCacheRef.current.delete(file)
      }
    }
  }, [selectedFiles])

  // Revoke all URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of urlCacheRef.current.values()) {
        URL.revokeObjectURL(url)
      }
    }
  }, [])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const validFiles = Array.from(incoming).filter(f => {
      if (!ACCEPTED.includes(f.type)) return false
      if (f.size > MAX_BYTES) return false
      return !selectedFiles.some(s => s.name === f.name && s.size === f.size)
    })
    if (validFiles.length > 0) {
      onFilesChange([...selectedFiles, ...validFiles])
    }
  }, [selectedFiles, onFilesChange])

  const removeFile = useCallback((file: File) => {
    onFilesChange(selectedFiles.filter(f => f !== file))
  }, [selectedFiles, onFilesChange])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files)
      e.target.value = ""
    }
  }, [addFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled && e.dataTransfer.files) {
      addFiles(e.dataTransfer.files)
    }
  }, [disabled, addFiles])

  const hasFiles = selectedFiles.length > 0

  return (
    <div className="w-full space-y-3">
      {/* Drop / click zone */}
      <label
        className={`
          relative flex items-center gap-3 w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl
          frosted-glass cursor-pointer transition-all duration-200
          ${isDragging ? "border-primary/60 bg-primary/10" : "hover:bg-white/[0.08] hover:border-primary/30"}
          active:scale-[0.99]
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
          className="sr-only"
          aria-label="Upload photos of your space"
        />

        <div className="p-2 rounded-lg bg-primary/10">
          {hasFiles ? (
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          ) : (
            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {hasFiles ? (
            <>
              <p className="text-sm sm:text-base text-foreground font-medium">
                {selectedFiles.length} photo{selectedFiles.length !== 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-muted-foreground">
                Click or drag to add more
              </p>
            </>
          ) : (
            <>
              <p className="text-sm sm:text-base text-foreground font-medium">
                Upload photos of your space
              </p>
              <p className="text-xs text-muted-foreground">
                Entrance, restroom, parking, or retail area · Select multiple photos
              </p>
            </>
          )}
        </div>

        <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
      </label>

      {/* Thumbnail grid */}
      {hasFiles && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="relative group frosted-glass rounded-xl overflow-hidden"
            >
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={getPreviewUrl(file)}
                  alt={`Photo ${index + 1}: ${file.name}`}
                  fill
                  className="object-cover"
                />
              </div>

              <button
                onClick={(e) => { e.preventDefault(); removeFile(file) }}
                disabled={disabled}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/80 hover:bg-background transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-background/60 backdrop-blur-sm">
                <p className="text-xs text-foreground truncate">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear all */}
      {hasFiles && !disabled && (
        <button
          onClick={() => onFilesChange([])}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all photos
        </button>
      )}
    </div>
  )
}
