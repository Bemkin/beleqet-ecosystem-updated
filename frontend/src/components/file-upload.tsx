'use client';

import React, { useRef, useState } from 'react';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File) => void;
}

/**
 * Beautiful drag-and-drop file upload zone for identity documents.
 */
export function FileUpload({ label, onFileSelect }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setError(null);

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Max size is 5MB.');
      return;
    }

    // Supported formats
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type. Only JPG, PNG, and PDF are allowed.');
      return;
    }

    setFileName(file.name);
    onFileSelect(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null); // PDF or other
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center min-h-[220px] p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'border-beleqet-lime bg-beleqet-emerald/10 shadow-lg shadow-beleqet-lime/5'
            : 'border-beleqet-border hover:border-beleqet-emerald hover:bg-beleqet-glass'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleChange}
        />

        {previewUrl ? (
          <div className="relative w-full max-h-[180px] flex justify-center items-center overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Uploaded Document Preview"
              className="max-h-[170px] max-w-full object-contain rounded-lg border border-beleqet-border"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <svg
              className={`w-12 h-12 mb-4 transition-colors ${
                dragActive ? 'text-beleqet-lime' : 'text-beleqet-emerald'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm font-semibold text-foreground/90 mb-1">{label}</p>
            <p className="text-xs text-muted-foreground/60 mb-2">
              Drag and drop, or <span className="text-beleqet-lime underline">browse files</span>
            </p>
            <p className="text-[10px] text-muted-foreground/40">
              Supports JPEG, PNG, and PDF (Max 5MB)
            </p>
          </div>
        )}

        {fileName && !error && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-beleqet-dark/80 backdrop-blur border border-beleqet-border px-3 py-1.5 rounded-lg">
            <span className="text-xs truncate max-w-[80%] font-mono text-beleqet-lime">
              ✓ {fileName}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                setPreviewUrl(null);
              }}
              className="text-[10px] text-red-400 hover:text-red-300 font-bold ml-2"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-2 font-medium bg-red-950/20 border border-red-500/10 px-3 py-1.5 rounded-lg">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
