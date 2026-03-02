"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

/* ------------------------------------------------------------------ */
/*  Toggle                                                             */
/* ------------------------------------------------------------------ */
function Toggle({
  defaultOn = false,
  onChange,
}: {
  defaultOn?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        const next = !on;
        setOn(next);
        onChange?.(next);
      }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-[#00C37B]" : "bg-[#334155]"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function AgentSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("CR");

  /* shared input classes */
  const inputBase =
    "bg-[#0B0E1A] border border-[#1E293B] rounded-md py-2.5 px-3.5 text-white text-sm w-full outline-none focus:border-[#00C37B]";

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-white">Settings</h1>
        <p className="text-[14px] text-[#94A3B8]">
          Manage your agent profile, security, and platform preferences.
        </p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* ==================== LEFT COL ==================== */}
        <div className="col-span-8">
          {/* -------- Card 1: Profile Details -------- */}
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00C37B]/10 text-[#00C37B]">
                {/* user icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <h2 className="text-[16px] font-semibold text-white">
                Profile Details
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Agent Username */}
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1.5">
                  Agent Username
                </label>
                <input
                  type="text"
                  value={user?.username ?? ""}
                  disabled
                  className={`${inputBase} opacity-60 cursor-not-allowed`}
                />
                <p className="text-xs text-[#64748B] mt-1">
                  Username cannot be changed
                </p>
              </div>

              {/* Display Nickname */}
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1.5">
                  Display Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter a nickname"
                  className={inputBase}
                />
              </div>

              {/* Email Address (full width) */}
              <div className="col-span-2">
                <label className="block text-sm text-[#94A3B8] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@example.com"
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          {/* -------- Card 2: Security Options -------- */}
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]">
                {/* lock icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <h2 className="text-[16px] font-semibold text-white">
                Security Options
              </h2>
            </div>

            {/* Change Password */}
            <div className="flex items-center justify-between py-4 border-b border-[#1E293B]">
              <div>
                <p className="text-sm font-medium text-white">
                  Change Password
                </p>
                <p className="text-xs text-[#64748B]">
                  Update your login credentials for added security.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-[#1E293B] px-4 py-2 text-sm text-white hover:border-[#00C37B] transition-colors"
              >
                Update Password
              </button>
            </div>

            {/* 2FA */}
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-white">
                  Two-Factor Authentication (2FA)
                </p>
                <p className="text-xs text-[#64748B]">
                  Add an extra layer of security with a verification code.
                </p>
              </div>
              <Toggle defaultOn />
            </div>
          </div>

          {/* -------- Card 3: Notifications -------- */}
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                {/* bell icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </span>
              <h2 className="text-[16px] font-semibold text-white">
                Notifications
              </h2>
            </div>

            <div className="divide-y divide-[#1E293B]">
              {/* Email alerts on large deposits */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Email alerts on large deposits
                  </p>
                </div>
                <Toggle defaultOn />
              </div>

              {/* Daily P&L summary */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Daily P&amp;L summary email
                  </p>
                </div>
                <Toggle defaultOn={false} />
              </div>

              {/* Sub-agent registration */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    New sub-agent registration alerts
                  </p>
                </div>
                <Toggle defaultOn />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COL ==================== */}
        <div className="col-span-4 space-y-6">
          {/* -------- Commission Rate -------- */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1A2235] to-[#111827] border border-[#00C37B]/30 rounded-xl p-6">
            {/* green glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#00C37B]/10 blur-3xl" />

            <p className="text-sm text-[#94A3B8] mb-1">
              Commission Rate
            </p>
            <p className="text-[32px] font-extrabold font-mono text-[#00C37B]">
              —
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Set by your admin
            </p>

            <hr className="border-[#1E293B] my-4" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#94A3B8]">
                  Sub-Agent Rebate
                </span>
                <span className="text-sm font-semibold text-white">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#94A3B8]">
                  Direct Member Share
                </span>
                <span className="text-sm font-semibold text-white">—</span>
              </div>
            </div>
          </div>

          {/* -------- Display Preferences -------- */}
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6">
            <h3 className="text-[15px] font-semibold text-white mb-4">
              Display Preferences
            </h3>

            {/* Timezone */}
            <div className="mb-4">
              <label className="block text-sm text-[#94A3B8] mb-1.5">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={`${inputBase} appearance-none`}
              >
                <option value="UTC">UTC</option>
                <option value="US/Eastern">Eastern</option>
                <option value="Asia/Singapore">Singapore</option>
              </select>
            </div>

            {/* Default Currency */}
            <div className="mb-4">
              <label className="block text-sm text-[#94A3B8] mb-1.5">
                Default Currency Display
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={`${inputBase} appearance-none`}
              >
                <option value="CR">Credits (CR)</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            {/* Compact Mode */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">Compact Mode</span>
              <Toggle defaultOn={false} />
            </div>
          </div>

          {/* -------- Action buttons -------- */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full rounded-lg bg-[#00C37B] py-2.5 text-sm font-semibold text-white hover:bg-[#00C37B]/90 transition-colors"
            >
              Save All Changes
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg border border-red-500/40 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Logout Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
