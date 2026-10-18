'use client';

import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { FiUploadCloud, FiFile, FiCheckCircle } from 'react-icons/fi';

export interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  helperText?: string;
  error?: string;
}

export function FileUpload({
  label,
  accept = '.xlsx, .xls, .csv',
  maxSizeMB = 5,
  onFileSelect,
  helperText = 'Excel (.xlsx, .xls) অথবা CSV ফাইল ড্রপ করুন বা ক্লিক করুন',
  error,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-2 text-left">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
          {label}
        </label>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-3',
          isDragOver
            ? 'border-indigo-600 bg-indigo-50/50'
            : selectedFile
            ? 'border-emerald-500 bg-emerald-50/20'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50',
          error && 'border-rose-400 bg-rose-50/20',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {selectedFile ? (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 justify-center">
                <FiFile className="w-4 h-4 text-emerald-600" />
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • পরিবর্তন করতে ক্লিক করুন
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-indigo-100/80 flex items-center justify-center text-indigo-600">
              <FiUploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                ফাইল আপলোড করতে ব্রাউজ করুন
              </p>
              <p className="text-xs text-slate-500 mt-1">{helperText}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">সর্বোচ্চ সাইজ: {maxSizeMB}MB</p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
