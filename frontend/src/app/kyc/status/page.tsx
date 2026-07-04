'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../lib/api';

/**
 * KYC status inquiry tracking page.
 */
export default function KycStatusPage() {
  const router = useRouter();
  
  const [kycRecord, setKycRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await apiRequest<any>('kyc/status');
        setKycRecord(data);
      } catch (err: any) {
        if (err.message.includes('No KYC record found')) {
          setKycRecord(null); // Explicit empty state
        } else {
          setError(err.message || 'Failed to fetch status details.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center font-sans">
        <div className="w-10 h-10 border-4 border-beleqet-emerald border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-muted-foreground/60">Fetching verification details...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-md bg-beleqet-card border border-beleqet-border rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Ambient background glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-beleqet-emerald/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-beleqet-lime/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          <h1 className="text-xl font-bold text-foreground mb-6 tracking-tight">KYC Status</h1>

          {error && (
            <div className="w-full p-4 bg-red-950/20 border border-red-500/10 text-red-400 rounded-2xl text-xs text-left font-medium mb-6">
              ⚠️ {error}
            </div>
          )}

          {!kycRecord ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-beleqet-glass border border-beleqet-border rounded-full flex items-center justify-center mx-auto mb-2 text-beleqet-lime text-2xl font-bold">
                ?
              </div>
              <h2 className="text-base font-bold text-foreground">Verification Required</h2>
              <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
                To activate client contracts and unlock freelancer wallet payouts, please complete your identification verification.
              </p>
              <button
                onClick={() => router.push('/kyc/submit')}
                className="w-full mt-4 py-3 rounded-xl bg-beleqet-emerald hover:bg-beleqet-emerald/90 text-beleqet-lime font-bold text-sm border border-beleqet-lime/20 shadow-lg transition-all duration-300"
              >
                Verify Identity Now
              </button>
            </div>
          ) : kycRecord.status === 'APPROVED' ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-beleqet-lime/10 border-2 border-beleqet-lime rounded-full flex items-center justify-center mx-auto shadow-lg shadow-beleqet-lime/10">
                <span className="text-beleqet-lime text-2xl font-bold">✓</span>
              </div>
              <h2 className="text-base font-bold text-foreground">Account Verified</h2>
              <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
                Your identity check is completed and approved. You are ready to start contracting and receiving payouts.
              </p>
              
              <div className="bg-beleqet-glass border border-beleqet-border rounded-2xl p-4 text-left space-y-2 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground/60">Verification Type</span>
                  <span className="font-semibold text-beleqet-lime">{kycRecord.documentType}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground/60">Confidence Level</span>
                  <span className="font-semibold text-foreground/90">{kycRecord.matchScore}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground/60">Verified Date</span>
                  <span className="font-mono text-muted-foreground/60">
                    {new Date(kycRecord.verifiedAt || kycRecord.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ) : kycRecord.status === 'REJECTED' ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-950/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <span className="text-red-500 text-2xl font-bold">✕</span>
              </div>
              <h2 className="text-base font-bold text-foreground">Verification Rejected</h2>
              <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
                Unfortunately, the documents or liveness check did not match.
              </p>

              {kycRecord.rejectionReason && (
                <div className="w-full text-xs text-red-400 bg-red-950/25 border border-red-500/10 p-4 rounded-2xl text-center leading-relaxed">
                  <span className="font-bold block text-red-500 mb-1">Reason:</span>
                  {kycRecord.rejectionReason}
                </div>
              )}

              <button
                onClick={() => router.push('/kyc/submit')}
                className="w-full mt-4 py-3 rounded-xl bg-beleqet-emerald hover:bg-beleqet-emerald/90 text-beleqet-lime font-bold text-sm border border-beleqet-lime/20 shadow-lg transition-all duration-300"
              >
                Re-submit Verification Files
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <span className="text-amber-500 text-2xl font-bold">⏱</span>
              </div>
              <h2 className="text-base font-bold text-foreground">In Review</h2>
              <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
                Your submitted documents and face scan are currently pending administrator validation. This review usually completes within a few business hours.
              </p>
              
              <div className="bg-beleqet-glass border border-beleqet-border rounded-2xl p-4 text-left space-y-2 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground/60">Submitted Type</span>
                  <span className="font-semibold text-beleqet-lime">{kycRecord.documentType}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground/60">Submitted Date</span>
                  <span className="font-mono text-muted-foreground/60">
                    {new Date(kycRecord.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
