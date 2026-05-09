"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MutableRefObject,
} from "react";
import { Box, ChevronDown, Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import type * as THREE from "three";
import { exportMeshBundle, exportSceneBundle } from "@/lib/export";
import { importBundle } from "@/lib/import";
import { useSession } from "@/lib/store";
import styles from "./ImportExportButton.module.css";

interface ImportExportButtonProps {
  meshRef?: MutableRefObject<THREE.Mesh | null>;
  sceneRef?: MutableRefObject<THREE.Scene | null>;
  analysisReady?: boolean;
}

export function ImportExportButton({
  meshRef,
  sceneRef,
  analysisReady = false,
}: ImportExportButtonProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const analysis = useSession((s) => s.analysis);
  const exportStage = useSession((s) => s.exportStage);
  const exportProgress = useSession((s) => s.exportProgress);
  const exportError = useSession((s) => s.exportError);
  const setExportStage = useSession((s) => s.setExportStage);
  const setExportError = useSession((s) => s.setExportError);
  const setExportProgress = useSession((s) => s.setExportProgress);

  const hasScene = !!analysis?.roomLayout;
  const isExporting = exportStage === "preparing" || exportStage === "zipping";
  const exportDone = exportStage === "done";
  const exportFailed = exportStage === "error";
  const shownError = localError ?? exportError;
  const canExportMesh = analysisReady && !!meshRef;
  const canExportScene = hasScene && !!sceneRef;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const runWithErrorState = useCallback(
    async (action: () => Promise<void>) => {
      setLocalError(null);
      setExportError(null);
      try {
        await action();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setExportStage("error");
        setExportProgress(0);
        setExportError(message);
      }
    },
    [setExportError, setExportProgress, setExportStage],
  );

  const handleImportClick = () => {
    setOpen(false);
    setLocalError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setLocalError(null);
      setExportError(null);
      try {
        const result = await importBundle(file);
        router.push(
          result.bundleType === "scene"
            ? `/analyze/${result.sessionId}/scene`
            : `/analyze/${result.sessionId}`,
        );
      } catch (error) {
        setLocalError(error instanceof Error ? error.message : String(error));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [router, setExportError],
  );

  const handleExportMesh = () => {
    setOpen(false);
    void runWithErrorState(() => exportMeshBundle(meshRef ?? { current: null }));
  };

  const handleExportScene = () => {
    setOpen(false);
    void runWithErrorState(() => exportSceneBundle(sceneRef ?? { current: null }));
  };

  const buttonLabel = isExporting
    ? exportStage === "preparing"
      ? "Preparing..."
      : "Compressing..."
    : exportDone
      ? "Downloaded"
      : exportFailed
        ? "Export failed"
        : "Import / Export";

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip"
        className="sr-only"
        aria-label="Import Accessify bundle"
        onChange={handleFileChange}
      />

      <button
        type="button"
        className={[
          styles.pill,
          open ? styles.pillOpen : "",
          exportDone ? styles.pillDone : "",
          exportFailed ? styles.pillError : "",
        ].join(" ")}
        onClick={() => !isExporting && setOpen((value) => !value)}
        disabled={isExporting}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {isExporting ? (
          <span
            className={styles.progressBar}
            style={{ transform: `scaleX(${exportProgress})` }}
          />
        ) : null}
        <span className={styles.pillLabel}>{buttonLabel}</span>
        <ChevronDown
          className={[styles.caret, open ? styles.caretUp : ""].join(" ")}
          aria-hidden="true"
        />
      </button>

      <div
        className={[
          styles.dropdown,
          open ? styles.dropdownOpen : "",
        ].join(" ")}
        role="menu"
        aria-label="Import or export options"
      >
        <button
          type="button"
          className={styles.option}
          role="menuitem"
          onClick={handleImportClick}
        >
          <span className={styles.optionIcon}>
            <Upload className={styles.icon} aria-hidden="true" />
          </span>
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>Import bundle</span>
            <span className={styles.optionSub}>Load a saved Accessify ZIP</span>
          </span>
        </button>

        <div className={styles.divider} aria-hidden="true" />

        <button
          type="button"
          className={styles.option}
          role="menuitem"
          disabled={!canExportMesh}
          title={!canExportMesh ? "Open a loaded 3D photo view to export the mesh" : undefined}
          onClick={canExportMesh ? handleExportMesh : undefined}
        >
          <span className={styles.optionIcon}>
            <Download className={styles.icon} aria-hidden="true" />
          </span>
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>Export 3D mesh</span>
            <span className={styles.optionSub}>OBJ, depth map, analysis, report</span>
          </span>
          <span className={styles.badge}>ZIP</span>
        </button>

        <button
          type="button"
          className={styles.option}
          role="menuitem"
          disabled={!canExportScene}
          title={!canExportScene ? "Open a procedural scene to export the simulation bundle" : undefined}
          onClick={canExportScene ? handleExportScene : undefined}
        >
          <span className={styles.optionIcon}>
            <Box className={styles.icon} aria-hidden="true" />
          </span>
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>Export simulation scene</span>
            <span className={styles.optionSub}>Room geometry, personas, layout JSON</span>
          </span>
          <span className={styles.badge}>ZIP</span>
        </button>
      </div>

      {shownError ? (
        <p className={styles.errorMsg} role="alert">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
