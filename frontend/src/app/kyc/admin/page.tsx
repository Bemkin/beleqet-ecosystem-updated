'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';

/**
 * KYC Admin review workspace. Lists pending requests and allows manual overrides.
 */
export default function KycAdminPage() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<any[]>('kyc/admin/pending');
      setVerifications(data);
      if (data.length > 0) {
        setSelectedKyc(data[0]);
      } else {
        setSelectedKyc(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending reviews. Make sure you are logged in as an ADMIN.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    setError(null);
    try {
      await apiRequest(`kyc/admin/approve/${id}`, { method: 'POST' });
      // Remove from list and select another
      const updated = verifications.filter((item) => item.id !== id);
      setVerifications(updated);
      setSelectedKyc(updated.length > 0 ? updated[0] : null);
    } catch (err: any) {
      setError(err.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await apiRequest(`kyc/admin/reject/${id}`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason }),
      });
      setRejectionReason('');
      const updated = verifications.filter((item) => item.id !== id);
      setVerifications(updated);
      setSelectedKyc(updated.length > 0 ? updated[0] : null);
    } catch (err: any) {
      setError(err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center font-sans">
        <div className="w-10 h-10 border-4 border-beleqet-emerald border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-muted-foreground/60">Loading verification requests...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">KYC Review Workspace</h1>
            <p className="text-xs text-muted-foreground/60">
              Review and audit pending face match submissions.
            </p>
          </div>
          <button
            onClick={fetchPending}
            className="text-xs font-semibold text-beleqet-lime bg-beleqet-emerald/20 hover:bg-beleqet-emerald/40 border border-beleqet-lime/10 px-4 py-2 rounded-xl transition-all"
          >
            Refresh List
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-500/10 text-red-400 rounded-2xl text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {verifications.length === 0 ? (
          <div className="bg-beleqet-card border border-beleqet-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <span className="text-4xl mb-4">🎉</span>
            <h2 className="text-lg font-bold text-foreground">Zero Pending Reviews</h2>
            <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto leading-relaxed">
              All Know Your Customer submissions have been successfully cleared. Great job!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Sidebar List */}
            <div className="md:col-span-1 bg-beleqet-card border border-beleqet-border rounded-3xl p-4 space-y-2 max-h-[600px] overflow-y-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50 px-2 mb-3">
                Pending Submissions ({verifications.length})
              </h2>
              {verifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedKyc(item)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    selectedKyc?.id === item.id
                      ? 'border-beleqet-lime bg-beleqet-emerald/10 shadow shadow-beleqet-lime/5'
                      : 'border-transparent hover:bg-beleqet-glass'
                  }`}
                >
                  <p className="text-xs font-bold text-foreground truncate">
                    {item.user.firstName} {item.user.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground/40 truncate mb-2">{item.user.email}</p>
                  <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground/60 bg-beleqet-dark/60 p-1.5 rounded-lg">
                    <span>{item.documentType}</span>
                    <span className={item.matchScore >= 80 ? 'text-beleqet-lime' : 'text-amber-400'}>
                      Score: {item.matchScore}%
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Verification Detail Review Workspace */}
            {selectedKyc && (
              <div className="md:col-span-2 bg-beleqet-card border border-beleqet-border rounded-3xl p-6 space-y-6 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-beleqet-emerald/5 rounded-full blur-2xl pointer-events-none" />

                <div className="border-b border-beleqet-border pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Reviewing: {selectedKyc.user.firstName} {selectedKyc.user.lastName}
                    </h2>
                    <p className="text-xs text-muted-foreground/60">{selectedKyc.user.email}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-[10px] font-mono text-muted-foreground/40 block">Submitted At</span>
                    <span className="font-mono text-muted-foreground/80">
                      {new Date(selectedKyc.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Face Verification Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-beleqet-glass border border-beleqet-border p-3.5 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/40 block mb-1">
                      Match Score
                    </span>
                    <span className="text-lg font-mono font-extrabold text-beleqet-lime">
                      {selectedKyc.matchScore}%
                    </span>
                  </div>
                  <div className="bg-beleqet-glass border border-beleqet-border p-3.5 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/40 block mb-1">
                      Liveness Passed
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        selectedKyc.livenessPassed ? 'text-beleqet-lime' : 'text-red-400'
                      }`}
                    >
                      {selectedKyc.livenessPassed ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="bg-beleqet-glass border border-beleqet-border p-3.5 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/40 block mb-1">
                      Document Type
                    </span>
                    <span className="text-xs font-bold text-foreground/90">{selectedKyc.documentType}</span>
                  </div>
                </div>

                {/* Side-by-Side Images */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 block">
                      ID Document Image
                    </label>
                    <div className="relative aspect-video sm:aspect-square bg-beleqet-dark border border-beleqet-border rounded-2xl overflow-hidden flex items-center justify-center group cursor-zoom-in">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedKyc.documentUrl}
                        alt="Submitted ID Document"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 block">
                      Live Selfie Capture
                    </label>
                    <div className="relative aspect-video sm:aspect-square bg-beleqet-dark border border-beleqet-border rounded-2xl overflow-hidden flex items-center justify-center group cursor-zoom-in">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedKyc.faceScanUrl}
                        alt="Captured Selfie"
                        className="max-w-full max-h-full object-cover scale-x-[-1]"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="border-t border-beleqet-border pt-6 flex flex-col sm:flex-row gap-4 justify-between items-stretch">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="flex-1 bg-beleqet-slate border border-beleqet-border focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-foreground/90 transition-all outline-none"
                    />
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReject(selectedKyc.id)}
                      className="bg-red-950/20 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500 text-red-400 font-bold px-5 py-2.5 rounded-xl text-xs transition-all disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedKyc.id)}
                    className="bg-beleqet-lime hover:bg-beleqet-lime/90 text-beleqet-dark font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex justify-center items-center disabled:opacity-40"
                  >
                    {actionLoading ? (
                      <div className="w-4 h-4 border-2 border-beleqet-dark border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Approve Verification'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
