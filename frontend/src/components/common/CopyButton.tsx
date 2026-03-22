"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  size?: number;
  className?: string;
}

export function CopyButton({ text, size = 14, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handle}
      className={`p-1.5 rounded-md transition-all ${className}`}
      style={{
        color: copied ? "var(--status-success)" : "var(--text-tertiary)",
        background: "transparent",
      }}
      title="Copy"
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}

export function CodeBlock({ value, label }: { value: string; label?: string }) {
  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}
    >
      {label && (
        <div
          className="px-3 py-1.5 text-xs border-b"
          style={{ color: "var(--text-tertiary)", borderColor: "var(--surface-border)" }}
        >
          {label}
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <code
          className="flex-1 text-sm font-mono break-all"
          style={{ color: "var(--brand-400)" }}
        >
          {value}
        </code>
        <CopyButton text={value} />
      </div>
    </div>
  );
}
