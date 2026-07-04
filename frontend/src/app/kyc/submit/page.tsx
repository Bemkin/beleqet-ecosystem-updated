'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '../../../components/file-upload';
import { CameraCapture } from '../../../components/camera-capture';
import { apiRequest } from '../../../lib/api';

enum DocumentType {
  PASSPORT = 'PASSPORT',
  NATIONAL_ID = 'NATIONAL_ID',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
}

/**
 * Multi-step form page for submitting identity documents and selfies for verification.
 */
export default function KycSubmitPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.NATIONAL_ID);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [faceScanFile, setFaceScanFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!documentFile || !faceScanFile) {
      setError('Please ensure both the document and face scan are provided.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('document', documentFile);
      formData.append('faceScan', faceScanFile);

      // Send files to NestJS backend
      const response = await apiRequest<any>('kyc/submit', {
        method: 'POST',
        body: formData,
      });

      setSuccessResult(response);
      setStep(4); // Move to completed step
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4 flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-lg bg-beleqet-card border border-beleqet-border rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-beleqet-lime/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-beleqet-emerald/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Identity Verification</h1>
          <p className="text-xs text-muted-foreground/60 text-center">
            Verify your profile to match with global freelancing opportunities.
          </p>
        </div>

        {/* Stepper progress indicator */}
        {step < 4 && (
          <div className="flex justify-between items-center mb-8 px-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1 last:flex-initial">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${
                    step >= num
                      ? 'bg-beleqet-emerald border-beleqet-lime text-beleqet-lime shadow-md shadow-beleqet-lime/10'
                      : 'bg-beleqet-slate border-beleqet-border text-muted-foreground/40'
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 rounded transition-all duration-300 ${
                      step > num ? 'bg-beleqet-emerald' : 'bg-beleqet-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-500/10 text-red-400 rounded-2xl text-xs flex gap-2 items-start font-medium">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Document Type & Upload Document */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground/80 mb-2 uppercase tracking-wider">
                Select Identification Document Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: DocumentType.NATIONAL_ID, label: 'National ID' },
                  { value: DocumentType.PASSPORT, label: 'Passport' },
                  { value: DocumentType.DRIVERS_LICENSE, label: 'Drivers License' },
                ].map((doc) => (
                  <button
                    key={doc.value}
                    type="button"
                    onClick={() => setDocumentType(doc.value)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold tracking-wide transition-all ${
                      documentType === doc.value
                        ? 'border-beleqet-lime bg-beleqet-emerald/20 text-beleqet-lime shadow shadow-beleqet-lime/5'
                        : 'border-beleqet-border hover:border-beleqet-emerald/50 bg-beleqet-glass text-muted-foreground/80'
                    }`}
                  >
                    {doc.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground/80 mb-2 uppercase tracking-wider">
                Upload Identification Document Image
              </label>
              <FileUpload
                label={`Upload your ${documentType.replace('_', ' ').toLowerCase()}`}
                onFileSelect={setDocumentFile}
              />
            </div>

            <button
              type="button"
              disabled={!documentFile}
              onClick={() => setStep(2)}
              className="w-full mt-6 py-3 rounded-xl bg-beleqet-emerald hover:bg-beleqet-emerald/90 text-beleqet-lime font-bold text-sm border border-beleqet-lime/20 shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to Selfie Scan
            </button>
          </div>
        )}

        {/* Step 2: Camera Capture (Live Face Scan) */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground/80 mb-2 uppercase tracking-wider text-center">
                Capture Live Face Scan
              </label>
              <CameraCapture onCapture={setFaceScanFile} />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-beleqet-border hover:border-beleqet-emerald bg-beleqet-glass text-xs font-bold transition-all"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!faceScanFile}
                onClick={() => setStep(3)}
                className="flex-[2] py-3 rounded-xl bg-beleqet-emerald hover:bg-beleqet-emerald/90 text-beleqet-lime font-bold text-sm border border-beleqet-lime/20 shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Proceed to Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review Details & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider mb-2">
              Submission Overview
            </h3>
            <div className="bg-beleqet-glass border border-beleqet-border rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground/60">Document Type</span>
                <span className="font-semibold text-beleqet-lime">
                  {documentType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground/60">ID File Attached</span>
                <span className="font-mono text-muted-foreground/40">{documentFile?.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground/60">Selfie Match File</span>
                <span className="font-mono text-muted-foreground/40">{faceScanFile?.name}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-beleqet-border hover:border-beleqet-emerald bg-beleqet-glass text-xs font-bold transition-all"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex-[2] py-3 rounded-xl bg-beleqet-lime hover:bg-beleqet-lime/90 text-beleqet-dark font-extrabold text-sm shadow-lg transition-all flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-beleqet-dark border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Submit Verification'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Verification Result Display */}
        {step === 4 && successResult && (
          <div className="text-center space-y-6 py-4">
            {successResult.status === 'APPROVED' ? (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-beleqet-lime/10 border-2 border-beleqet-lime rounded-full flex items-center justify-center mx-auto shadow-lg shadow-beleqet-lime/10">
                  <span className="text-beleqet-lime text-2xl font-bold">✓</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Verification Successful!</h2>
                <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto">
                  Congratulations! Our automated KYC check successfully matched your face scan with the uploaded ID card. Your profile is now verified.
                </p>
                <div className="inline-block bg-beleqet-emerald/20 border border-beleqet-lime/10 px-4 py-2 rounded-xl text-xs text-beleqet-lime font-mono">
                  Confidence Score: {successResult.matchScore}%
                </div>
              </div>
            ) : successResult.status === 'REJECTED' ? (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-red-950/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-red-500 text-2xl font-bold">✕</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Verification Failed</h2>
                <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto">
                  Unfortunately, the automated check could not confirm your identity.
                </p>
                {successResult.rejectionReason && (
                  <p className="text-xs text-red-400 bg-red-950/25 border border-red-500/10 p-3 rounded-2xl text-center">
                    Reason: {successResult.rejectionReason}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDocumentFile(null);
                    setFaceScanFile(null);
                    setStep(1);
                  }}
                  className="bg-beleqet-emerald hover:bg-beleqet-emerald/90 text-beleqet-lime text-xs font-bold px-5 py-2.5 rounded-xl border border-beleqet-lime/20 shadow-md transition-all"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-amber-500 text-2xl font-bold">⏱</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Verification Pending</h2>
                <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto">
                  Your details have been submitted. An administrator is currently reviewing the face match results. You will receive an alert as soon as they complete the review.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => router.push('/kyc/status')}
              className="text-xs text-muted-foreground hover:text-beleqet-lime underline font-semibold mt-4 block mx-auto"
            >
              Go to Status Page
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
