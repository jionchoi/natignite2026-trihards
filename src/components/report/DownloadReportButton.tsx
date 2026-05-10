"use client";

import { Button } from "@/components/ui/Button";
import { type Analysis } from "@/lib/schemas";
import { generateMarkdownReport } from "@/lib/report";

interface DownloadReportButtonProps {
  analysis: Analysis;
  spaceType: string;
  notes?: string;
}

export function DownloadReportButton(props: DownloadReportButtonProps) {
  const onClick = () => {
    const md = generateMarkdownReport(props);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accessibility-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="secondary" size="sm" onClick={onClick}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Download report
    </Button>
  );
}
