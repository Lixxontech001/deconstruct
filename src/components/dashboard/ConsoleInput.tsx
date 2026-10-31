"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileCode,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Play,
  Loader2,
  Check,
} from "lucide-react";
import type { ModuleType } from "@/types/database";
import { MODULE_REGISTRY } from "./ModuleSelector";

interface ConsoleInputProps {
  activeModule: ModuleType;
  inputValue: string;
  onInputChange: (value: string) => void;
  targetLanguage: "typescript" | "python";
  onTargetLanguageChange: (lang: "typescript" | "python") => void;
  targetFramework: "react" | "vue";
  onTargetFrameworkChange: (fw: "react" | "vue") => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB Limit

export function ConsoleInput({
  activeModule,
  inputValue,
  onInputChange,
  targetLanguage,
  onTargetLanguageChange,
  targetFramework,
  onTargetFrameworkChange,
  onSubmit,
  isLoading,
}: ConsoleInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConfig = MODULE_REGISTRY[activeModule];

  // Handle file reading with size verification (<5MB)
  const processFile = (file: File) => {
    setErrorMessage(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`Payload exceeds 5MB client limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        onInputChange(text);
        setFileName(file.name);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read dropped file. Please paste directly.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleLoadSample = () => {
    setErrorMessage(null);
    setFileName(null);
    onInputChange(activeConfig.sampleInput);
  };

  const handleClear = () => {
    onInputChange("");
    setFileName(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const characterCount = inputValue.length;
  const lineCount = inputValue ? inputValue.split("\n").length : 0;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Top Header / Config Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200">
            Source Payload Console
          </span>
          {fileName && (
            <span className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300 border border-zinc-700">
              <Check className="h-3 w-3 text-emerald-400" />
              {fileName}
            </span>
          )}
        </div>

        {/* Dynamic Controls based on active module */}
        <div className="flex items-center gap-2">
          {activeModule === "cleanroom" ? (
            <div className="flex items-center rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => onTargetFrameworkChange("react")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  targetFramework === "react"
                    ? "bg-zinc-800 text-emerald-300 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                React (TSX)
              </button>
              <button
                type="button"
                onClick={() => onTargetFrameworkChange("vue")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  targetFramework === "vue"
                    ? "bg-zinc-800 text-emerald-300 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Vue 3
              </button>
            </div>
          ) : (activeModule === "forge" || activeModule === "logic") ? (
            <div className="flex items-center rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => onTargetLanguageChange("typescript")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  targetLanguage === "typescript"
                    ? "bg-zinc-800 text-emerald-300 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                TypeScript
              </button>
              <button
                type="button"
                onClick={() => onTargetLanguageChange("python")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  targetLanguage === "python"
                    ? "bg-zinc-800 text-emerald-300 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Python
              </button>
            </div>
          ) : null}

          {/* Load Sample Button */}
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            title="Load sample test payload for this module"
          >
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span className="hidden sm:inline">Load Sample</span>
          </button>

          {/* Clear Button */}
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition-colors"
              title="Clear input"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Editor & Drag/Drop Workspace */}
      <div
        className={`relative flex-1 flex flex-col min-h-[360px] sm:min-h-[420px] transition-colors ${
          isDragging ? "bg-emerald-950/20 ring-2 ring-emerald-500/50" : "bg-[#09090b]/80"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          value={inputValue}
          onChange={(e) => {
            onInputChange(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          disabled={isLoading}
          placeholder={activeConfig.placeholderText}
          spellCheck={false}
          className="w-full flex-1 p-4 bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed selection:bg-emerald-500/30"
        />

        {/* Drag and Drop Overlay Hint if empty */}
        {!inputValue && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-x-8 bottom-12 top-24 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/30 hover:bg-zinc-900/30 transition-all cursor-pointer p-6 text-center group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 group-hover:bg-zinc-800 border border-zinc-800 text-zinc-400 group-hover:text-emerald-400 transition-colors mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium text-zinc-300">
              Drop <span className="font-mono text-emerald-400">{activeConfig.acceptedFiles}</span> file here or <span className="text-emerald-400 underline">browse</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Supports files up to 5MB. In-memory sanitized prior to cloud execution.
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={activeConfig.acceptedFiles}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-950/50 border-t border-rose-900/50 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{characterCount.toLocaleString()} chars</span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || !inputValue.trim()}
          className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold shadow-lg transition-all ${
            isLoading || !inputValue.trim()
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/40"
              : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-95 cursor-pointer font-bold"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-zinc-900" />
              <span>Deconstructing...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Execute Deconstruction</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
