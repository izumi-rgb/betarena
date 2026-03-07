'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { copyToClipboard } from '@/lib/copyToClipboard';

interface ResetPasswordModalProps {
  targetId: number;
  targetName: string;
  apiEndpoint: string;
  onClose: () => void;
}

export function ResetPasswordModal({ targetName, apiEndpoint, onClose }: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ username: string; password: string }>(apiEndpoint);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || 'Failed to reset password');
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (field: string, value: string) => {
    copyToClipboard(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
  const checkIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C37B" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-8 w-[440px] shadow-2xl">
        {result ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#00C37B]/10 flex items-center justify-center text-[#00C37B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-[15px]">Password Reset</h3>
                <p className="text-[#64748B] text-[11px]">New credentials for {targetName}</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Username</label>
                <div className="mt-1 bg-[#1A2235] border border-[#1E293B] rounded-lg px-4 py-3 font-mono text-white text-sm flex justify-between items-center">
                  {result.username}
                  <button onClick={() => handleCopy('username', result.username)} className="text-[#64748B] hover:text-[#00C37B]">
                    {copied === 'username' ? checkIcon : copyIcon}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">New Password</label>
                <div className="mt-1 bg-[#1A2235] border border-[#1E293B] rounded-lg px-4 py-3 font-mono text-white text-sm flex justify-between items-center">
                  {result.password}
                  <button onClick={() => handleCopy('password', result.password)} className="text-[#64748B] hover:text-[#00C37B]">
                    {copied === 'password' ? checkIcon : copyIcon}
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg p-3 mb-6">
              <p className="text-[#F59E0B] text-[11px] font-medium">Save the new password — it cannot be retrieved again.</p>
            </div>
            <button onClick={onClose} className="w-full bg-[#1A2235] border border-[#1E293B] text-white font-bold py-3 rounded-lg hover:bg-[#1E293B] transition-colors">
              Close
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-[15px]">Reset Password</h3>
                <p className="text-[#64748B] text-[11px]">Generate a new password for {targetName}</p>
              </div>
            </div>
            <p className="text-[#94A3B8] text-[13px] mb-6">
              This will generate a new random password for <strong className="text-white">{targetName}</strong>. The current password will stop working immediately.
            </p>
            {error && <p className="mb-4 text-[13px] text-[#EF4444]">{error}</p>}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 bg-[#1A2235] border border-[#1E293B] text-[#94A3B8] font-bold py-3 rounded-lg hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 bg-[#F59E0B] hover:bg-[#d97706] text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
